const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_CHATBOT
);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-3.7-flash"
});

async function generateWithRetry(
  prompt,
  maxAttempts = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt);

      return result.response.text().trim();
    } catch (error) {
      lastError = error;

      const message = error.message || "";

      const retryable =
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503 ||
        /high demand|temporarily unavailable|rate limit/i.test(
          message
        );

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 2000;

      console.log(
        `Gemini unavailable. Retrying in ${delay / 1000}s...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
}

async function generateAnswer(prompt) {
  return generateWithRetry(prompt);
}

module.exports = {
  generateAnswer,
  generateWithRetry
};