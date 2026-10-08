require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_CHATBOT
);

async function testModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY_CHATBOT}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:");
      console.error(data);
      return;
    }

    console.log("\nModels available for your API key:\n");

    const models = data.models || [];

    models
      .filter((model) =>
        model.supportedGenerationMethods?.includes(
          "generateContent"
        )
      )
      .forEach((model) => {
        console.log(
          model.name.replace("models/", "")
        );
      });
  } catch (error) {
    console.error(
      "Failed to fetch Gemini models:",
      error.message
    );
  }
}

testModels();
