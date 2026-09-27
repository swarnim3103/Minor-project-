const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { embedText } = require("./embed");
const { loadStore, search } = require("./vectorstore");

const STORE_PATH = path.join(__dirname, "data", "embeddings.json");
const TOP_K = 4;

const SYSTEM_PROMPT = `You are a medical information assistant for a healthcare app called MedCare.
Answer the user's question directly and naturally, the way a knowledgeable assistant would.
Rules:
- Do not mention "reference material", "the provided text", "the book", "context", or anything
  about where your information came from. Just answer the question.
- If you don't have enough information to answer confidently, say so plainly, without
  explaining why (don't mention documents or context).
- Never provide a diagnosis or tell the user what condition they personally have.
- Always remind the user to consult a licensed doctor or pharmacist for actual medical
  decisions, diagnosis, or treatment.
- Be clear, concise, and avoid unnecessary medical jargon.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHATBOT);
const model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
  systemInstruction: SYSTEM_PROMPT,
});

let storeCache = null;
function getStore() {
  if (!storeCache) storeCache = loadStore(STORE_PATH);
  return storeCache;
}

function buildPrompt(question, contextChunks) {
  const context = contextChunks.map((c) => c.text).join("\n\n---\n\n");
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
      const delay = 1000 * attempt; // 1s, 2s, ...
      console.warn(`Gemini 503, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(delay);
    }
  }
  throw lastErr;
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
    const store = getStore();
    const queryEmbedding = await embedText(question);
    const topChunks = search(store, queryEmbedding, TOP_K);

    const result = await generateWithRetry(buildPrompt(question, topChunks));
    const answer = result.response.text();

    res.json({
      answer,
      sources: [], // no per-chunk metadata (medicine/topic/url) yet, so nothing to show
    });
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