const { retrieveDocuments } = require("../rag/retrieve");
const { generateMedicalAnswer } = require("../rag/groq");
const { isMedicalQuery } = require("../rag/medicalGuard");

async function chat(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please provide a message."
      });
    }

    const userMessage = message.trim();

    console.log("Chat query:", userMessage);

    // --------------------------------
    // 1. Medical query guard
    // --------------------------------

    if (!isMedicalQuery(userMessage)) {
      return res.status(200).json({
        answer:
          "I can help with medicines, medication safety, side effects, interactions, missed doses, and general medical information. Please ask a medical or medication-related question.",
        sources: []
      });
    }

    // --------------------------------
    // 2. Retrieve medical information
    // --------------------------------

    console.log("Retrieving medical information...");

    const documents = await retrieveDocuments(
      userMessage,
      3
    );

    // --------------------------------
    // 3. Generate grounded answer
    // --------------------------------

    console.log("Generating answer with Groq...");

    const answer = await generateMedicalAnswer(
      userMessage,
      documents
    );

    // --------------------------------
    // 4. Prepare sources
    // --------------------------------

    const sources = documents.map((doc) => ({
      medicine: doc.medicine,
      topic: doc.topic,
      source: doc.source,
      source_url: doc.source_url,
      similarity: Number(
        doc.similarity.toFixed(4)
      )
    }));

    return res.status(200).json({
      answer,
      sources
    });

  } catch (error) {
    console.error("Chat controller error:");
    console.error(error);

    return res.status(500).json({
      message:
        "Unable to process your medical question."
    });
  }
}

module.exports = {
  chat
};