const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const OPENFDA_URL = "https://api.fda.gov/drug/label.json";

const SYSTEM_PROMPT = `You are a medical information assistant for a healthcare app called MedCare.
Answer the user's question directly and naturally, the way a knowledgeable assistant would.
Formatting rules (important):
- Keep it crisp. Do not write dense paragraphs.
- When answering about a medicine, structure the answer as short labeled lines, each on its
  own line, only including lines that are relevant:
  Uses: <one short sentence>
  Dosage: <one short sentence, only if clearly relevant>
  Side effects: <one short sentence, common ones only>
  Warnings: <one short sentence, most important caution only>
- Do not use markdown symbols like **, #, or -. Just plain short lines as shown above.
- End with a brief one-line reminder to consult a licensed doctor or pharmacist.
- For greetings or small talk, skip the structured format and reply warmly in 1-2 sentences.
Other rules:
- Do not mention "reference material", "the provided text", "context", "FDA label", "openFDA",
  or anything about where your information came from. Just answer the question.
- If you don't have enough information to answer confidently, say so plainly, without
  explaining why.
- Never provide a diagnosis or tell the user what condition they personally have.
- Avoid unnecessary medical jargon.
- If the user shares something personal or serious (e.g. "I have cancer", "my dad was just
  diagnosed with diabetes"), respond with genuine empathy first, do not diagnose or speculate,
  and gently encourage them to talk to their doctor or care team. Only give general medicine
  information if they go on to ask about a specific medicine.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHATBOT);
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
  systemInstruction: SYSTEM_PROMPT,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Strips common question phrasing to guess the actual drug name being asked about.
// Not perfect, but good enough to turn "can you tell me about metformin?" into "metformin".
const FILLER_PATTERNS = [
  /\bcan you\b/gi,
  /\bcould you\b/gi,
  /\bplease\b/gi,
  /\btell me about\b/gi,
  /\bwhat (is|are)\b/gi,
  /\btell me\b/gi,
  /\binformation (on|about)\b/gi,
  /\binfo (on|about)\b/gi,
  /\bside effects? of\b/gi,
  /\buses? of\b/gi,
  /\bdosage (of|for)\b/gi,
  /\bexplain\b/gi,
  /\babout\b/gi,
  /\b(hello|hi|hey+|hii+|yo|greetings)\b/gi,
  /[?.!,]/g,
];

const SMALL_TALK = new Set(["hello", "hi", "hey", "thanks", "thank you", "bye", "ok", "okay"]);

// Words that signal a personal statement/disclosure rather than a medicine-name lookup
// (e.g. "I have cancer", "my father has diabetes") — these should go straight to a normal,
// empathetic reply instead of triggering an openFDA search that will just come up empty.
const PERSONAL_STATEMENT_WORDS = new Set([
  "i", "im", "i'm", "my", "me", "we", "us", "our",
  "have", "having", "has", "had",
  "am", "is", "are", "was", "were",
  "feel", "feeling", "felt",
  "diagnosed", "suffer", "suffering",
  "hurts", "hurting", "sick", "ill", "pain",
]);

function extractDrugName(question) {
  let text = question;
  for (const pattern of FILLER_PATTERNS) {
    text = text.replace(pattern, " ");
  }
  text = text.replace(/\s+/g, " ").trim();

  if (!text || text.length < 3 || SMALL_TALK.has(text.toLowerCase())) {
    return null;
  }

  const words = text.toLowerCase().split(" ");
  const looksLikeStatement =
    words.length > 3 || words.some((w) => PERSONAL_STATEMENT_WORDS.has(w));
  if (looksLikeStatement) {
    return null;
  }

  return text;
}

async function runOpenFDAQuery(search) {
  try {
    const response = await axios.get(OPENFDA_URL, {
      params: { search, limit: 1 },
      timeout: 8000,
    });
    return response.data.results?.[0] || null;
  } catch (err) {
    // openFDA returns 404 for genuinely no matches, but can also return
    // 400/500 for malformed queries. Either way, treat it as "no match"
    // rather than crashing the whole chat response.
    console.warn(`openFDA query failed:`, err.response?.status || err.message);
    return null;
  }
}

async function searchOpenFDA(drugName) {
  const escaped = drugName.replace(/"/g, "");

  // Attempt 1: exact match on the name as typed.
  const exactSearch =
    `openfda.generic_name:"${escaped}" OR ` +
    `openfda.brand_name:"${escaped}" OR ` +
    `openfda.substance_name:"${escaped}"`;
  const exactMatch = await runOpenFDAQuery(exactSearch);
  if (exactMatch) return exactMatch;

  // Attempt 2: fuzzy match to tolerate typos (e.g. "metformn", "paracetmol").
  // Lucene fuzzy (~) only works on single unquoted terms, so this works best
  // for one-word drug names, which covers the large majority of real queries.
  const term = escaped.replace(/\s+/g, "");
  if (!term) return null;
  const fuzzySearch =
    `openfda.generic_name:${term}~2 OR ` +
    `openfda.brand_name:${term}~2 OR ` +
    `openfda.substance_name:${term}~2`;
  return runOpenFDAQuery(fuzzySearch);
}

function firstOrEmpty(field) {
  return Array.isArray(field) && field.length > 0 ? field[0] : "";
}

function buildDrugContext(label) {
  const parts = [
    ["Uses", firstOrEmpty(label.indications_and_usage)],
    ["Dosage", firstOrEmpty(label.dosage_and_administration)],
    ["Warnings", firstOrEmpty(label.warnings || label.warnings_and_cautions)],
    ["Contraindications", firstOrEmpty(label.contraindications)],
    ["Side effects", firstOrEmpty(label.adverse_reactions)],
  ].filter(([, text]) => text);

  return parts.map(([label, text]) => `${label}: ${text}`).join("\n\n");
}

function buildPrompt(question, context) {
  if (!context) return question;
  return `Background information (do not mention this to the user, just use it to answer):\n${context}\n\nUser's question: ${question}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries only on 503 (temporary overload). Other errors fail immediately.
async function generateWithRetry(prompt, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      lastErr = err;
      const is503 = err.status === 503 || /503/.test(err.message || "");
      if (!is503 || attempt === maxAttempts) throw err;
      const delay = 1000 * attempt;
      console.warn(`Gemini 503, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

// Asks Groq (a second, independent model) the same question. Returns null on
// any failure so a Groq outage never breaks the chat — Gemini's answer alone
// is still a perfectly good fallback.
async function generateGroqAnswer(prompt) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.warn("Groq call failed:", err.message);
    return null;
  }
}

// Simple word-overlap similarity (Jaccard index) between two answers.
// 1.0 = identical word sets, 0.0 = nothing in common. This is the "consensus
// check": two independent models agreeing closely is a good signal the
// answer is grounded and not one model hallucinating.
function jaccardSimilarity(textA, textB) {
  const toWordSet = (text) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
    );
  const setA = toWordSet(textA);
  const setB = toWordSet(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

const AGREEMENT_THRESHOLD = 0.3;

// Runs both models on the same prompt and reports how well they agree.
async function generateWithConsensus(prompt) {
  const [geminiResult, groqAnswer] = await Promise.all([
    generateWithRetry(prompt),
    generateGroqAnswer(prompt),
  ]);
  const geminiAnswer = geminiResult.response.text();

  if (!groqAnswer) {
    // Groq unavailable/not configured — fall back to Gemini alone.
    return { answer: geminiAnswer, confidence: "unverified", agreement: null };
  }

  const agreement = jaccardSimilarity(geminiAnswer, groqAnswer);
  const confidence = agreement >= AGREEMENT_THRESHOLD ? "high" : "low";

  console.log(
    `Consensus check: agreement=${agreement.toFixed(2)} confidence=${confidence}`
  );

  // Gemini's answer is used as the primary response either way (it's the one
  // grounded in the openFDA context via buildPrompt); Groq serves as the
  // independent check. Only the confidence/agreement info differs.
  return { answer: geminiAnswer, confidence, agreement };
}

// POST /api/chat  { "message": "..." }
async function chat(req, res) {
  const { message: question } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Field 'message' (non-empty string) is required." });
  }
  if (!process.env.GEMINI_API_KEY_CHATBOT) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY_CHATBOT." });
  }

  try {
    const drugName = extractDrugName(question);
    let label = null;

    if (drugName) {
      label = await searchOpenFDA(drugName);
    }

    let answer;
    let sources = [];

    if (drugName && !label) {
      answer =
        "I don't have information on that. Please consult a licensed doctor or pharmacist for advice.";
    } else {
      const context = label ? buildDrugContext(label) : "";
      const { answer: finalAnswer, confidence, agreement } = await generateWithConsensus(
        buildPrompt(question, context)
      );
      answer = finalAnswer;

      if (label) {
        const name = drugName.charAt(0).toUpperCase() + drugName.slice(1);
        sources = [
          {
            medicine: name,
            topic: "Drug label information",
            source: "openFDA",
            source_url: `https://labels.fda.gov/`,
            similarity: 1,
          },
        ];
      }

      return res.json({ answer, sources, confidence, agreement });
    }

    res.json({ answer, sources });
  } catch (err) {
    console.error("Chat error:", err);
    const is503 = err.status === 503 || /503/.test(err.message || "");
    const message = is503
      ? "The AI service is busy right now. Please try again in a moment."
      : "Something went wrong answering the question.";
    res.status(is503 ? 503 : 500).json({ error: message });
  }
}

module.exports = { chat };