const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { embedText } = require("./embed");
const { loadStore, search } = require("./vectorstore");

const STORE_PATH = path.join(__dirname, "data", "embeddings.json");
const TOP_K = 4;

const SYSTEM_PROMPT = `You are a medical information assistant. You answer ONLY using the
reference material provided in each message's context. Rules:
- If the context does not contain the answer, say you don't have that information in your
  reference material, rather than guessing or using outside knowledge.
- Never provide a diagnosis or tell the user what condition they personally have.
- Always remind the user to consult a licensed doctor or pharmacist for actual medical
  decisions, diagnosis, or treatment.
- Be clear, concise, and avoid medical jargon where possible.`;

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
  const context = contextChunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c.text}`)
    .join("\n\n");
  return `Reference material:\n${context}\n\nQuestion: ${question}\n\nAnswer using only the reference material above.`;
}

// POST /api/chat  { "question": "..." }
async function chat(req, res) {
  const { message: question } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Field 'question' (non-empty string) is required." });
  }
  if (!process.env.GEMINI_API_KEY_CHATBOT) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY_CHATBOT." });
  }

  try {
    const store = getStore();
    const queryEmbedding = await embedText(question);
    const topChunks = search(store, queryEmbedding, TOP_K);

    const result = await model.generateContent(buildPrompt(question, topChunks));
    const answer = result.response.text();

    res.json({
      answer,
      sources: topChunks.map((c) => c.source),
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Something went wrong answering the question." });
  }
}

module.exports = { chat };