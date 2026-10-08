const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function generateWithRetry(prompt) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    return (
      completion.choices?.[0]?.message?.content?.trim() || ""
    );
  } catch (error) {
    console.error("Groq error:", error.message);
    throw error;
  }
}

async function generateVerification(prompt) {
  return generateWithRetry(prompt);
}

module.exports = {
  generateVerification,
  generateWithRetry
};