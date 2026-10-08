const { resolveQuery } = require("./query");
const { retrieveMedicines } = require("./retriever");
const { buildMedicalPrompt } = require("./prompt");
const { generateAnswer } = require("./gemini");
const { generateVerification } = require("./groq");
const { verifyAnswers } = require("./consensus");

const CONSENSUS_THRESHOLD = Number(
  process.env.CONSENSUS_THRESHOLD || 0.55
);

function isGreeting(message) {
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening"
  ];

  return greetings.includes(
    message.trim().toLowerCase()
  );
}

function parseGeminiResponse(answer) {
  try {
    const cleaned = answer
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Failed to parse Gemini JSON:",
      error.message
    );

    return {
      title: "Medicine Information",
      summary: answer,
      standaloneAvailable: false,
      medicines: [],
      warning:
        "Please consult a qualified doctor or pharmacist for medicine-specific advice."
    };
  }
}

function buildVerificationPrompt({
  question,
  retrievedMedicines
}) {
  const evidence = retrievedMedicines
    .map((result, index) => {
      const medicine = result.medicine;

      return `
MEDICINE ${index + 1}

Name:
${medicine["Medicine Name"] || "Not available"}

Composition:
${medicine["Composition"] || "Not available"}

Uses:
${medicine["Uses"] || "Not available"}

Side Effects:
${medicine["Side_effects"] || "Not available"}

Manufacturer:
${medicine["Manufacturer"] || "Not available"}
`;
    })
    .join("\n-------------------------\n");

  return `
You are the independent verification model for MedCare.

Your task is to independently answer the SAME medical
question using ONLY the provided medicine evidence.

USER QUESTION:
${question}

AVAILABLE MEDICINE EVIDENCE:

${evidence || "No evidence available."}

IMPORTANT OUTPUT FORMAT:

Return ONLY valid JSON.

Do NOT use Markdown.
Do NOT use a code block.
Do NOT add text outside the JSON.

Use EXACTLY this structure:

{
  "title": "Medicine name or topic",
  "summary": "Short summary of the available information",
  "standaloneAvailable": false,
  "medicines": [
    {
      "name": "Medicine name",
      "composition": "Composition",
      "uses": "Uses",
      "sideEffects": [
        "Side effect 1",
        "Side effect 2"
      ]
    }
  ],
  "warning": "Medical safety message"
}

RULES:

1. Use only the provided medicine evidence.

2. Do not invent medical information.

3. Do not blindly agree with another model.

4. Do not diagnose diseases or medical conditions.

5. Do not prescribe medicines.

6. Do not recommend changing, increasing,
   decreasing, or stopping dosage.

7. Do not add unsupported information about
   drug interactions, pregnancy, contraindications,
   or dosage.

8. If the requested medicine does not have a
   standalone entry, set standaloneAvailable to false.

9. If combination medicines contain the requested
   medicine, list those medicines separately.

10. Keep the response concise and factual.

11. If information is unavailable, clearly say so.

Return ONLY the JSON object.
`;
}

async function chat({
  message,
  history = []
}) {
  if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }

  const userMessage = message.trim();

  // --------------------------------------------------
  // STEP 1: GREETING
  // --------------------------------------------------

  if (isGreeting(userMessage)) {
    return {
      answer: {
        title: "MedCare",
        summary:
          "Hello! I can help you understand information about medicines, including their uses and commonly reported side effects.",
        standaloneAvailable: false,
        medicines: [],
        warning:
          "This information is educational and should not replace professional medical advice."
      },

      sources: [],

      verified: true,

      similarity: 1,

      retrievedQuestion: userMessage
    };
  }

  // --------------------------------------------------
  // STEP 2: RESOLVE CONVERSATIONAL CONTEXT
  // --------------------------------------------------

  const resolvedQuestion = await resolveQuery(
    userMessage,
    history
  );

  console.log(
    "Resolved question:",
    resolvedQuestion
  );

  // --------------------------------------------------
  // STEP 3: RETRIEVE MEDICINES
  // --------------------------------------------------

  const retrievedMedicines = retrieveMedicines(
    resolvedQuestion,
    5
  );

  console.log("Retrieved medicines:");

  retrievedMedicines.forEach(
    ({ medicine, score }, index) => {
      console.log(
        `${index + 1}. ${
          medicine["Medicine Name"]
        } - ${score.toFixed(3)}`
      );
    }
  );

  // --------------------------------------------------
  // STEP 4: NO RELEVANT MEDICINE FOUND
  // --------------------------------------------------

  if (!retrievedMedicines.length) {
    return {
      answer: {
        title: "Medicine Information",

        summary:
          "I could not find enough relevant medicine information in the available database to answer this question reliably.",

        standaloneAvailable: false,

        medicines: [],

        warning:
          "Please consult a qualified doctor or pharmacist."
      },

      sources: [],

      verified: false,

      similarity: 0,

      retrievedQuestion: resolvedQuestion
    };
  }

  // --------------------------------------------------
  // STEP 5: BUILD GROUNDED GEMINI PROMPT
  // --------------------------------------------------

  const prompt = buildMedicalPrompt({
    question: resolvedQuestion,
    retrievedMedicines,
    conversationHistory: history
  });

  // --------------------------------------------------
  // STEP 6: GEMINI PRIMARY ANSWER
  // --------------------------------------------------

  const geminiRawAnswer =
    await generateAnswer(prompt);

  if (!geminiRawAnswer) {
    throw new Error(
      "Gemini returned an empty answer."
    );
  }

  console.log(
    "Gemini answer generated."
  );

  // Convert Gemini JSON string into JavaScript object
  const geminiData =
    parseGeminiResponse(geminiRawAnswer);

  // --------------------------------------------------
  // STEP 7: GROQ INDEPENDENT VERIFICATION
  // --------------------------------------------------

  const verificationPrompt =
    buildVerificationPrompt({
      question: resolvedQuestion,
      retrievedMedicines
    });

  let groqData = null;

  try {
    const groqRawAnswer =
      await generateVerification(
        verificationPrompt
      );

    if (groqRawAnswer) {
      console.log(
        "Groq verification answer generated."
      );

      groqData =
        parseGeminiResponse(groqRawAnswer);
    }
  } catch (error) {
    console.error(
      "Groq verification failed:",
      error.message
    );
  }

  // --------------------------------------------------
  // STEP 8: JACCARD CONSENSUS
  // --------------------------------------------------

  let verified = false;
  let similarity = 0;

  if (groqData) {
    const verification =
      verifyAnswers(
        JSON.stringify(geminiData),
        JSON.stringify(groqData),
        CONSENSUS_THRESHOLD
      );

    verified = verification.verified;
    similarity = verification.similarity;

    console.log(
      `Gemini/Groq similarity: ${similarity.toFixed(
        3
      )}`
    );
  }

  // --------------------------------------------------
  // STEP 9: RETURN GEMINI ANSWER
  // --------------------------------------------------
  //
  // TEMPORARY BEHAVIOUR:
  // We calculate Jaccard similarity but do not
  // block the Gemini answer when similarity is low.
  //
  // Gemini remains the PRIMARY model.
  // --------------------------------------------------

  return {
    answer: geminiData,

    sources: buildSources(
      retrievedMedicines
    ),

    verified,

    similarity,

    retrievedQuestion: resolvedQuestion
  };
}

// --------------------------------------------------
// BUILD FRONTEND SOURCES
// --------------------------------------------------

function buildSources(
  retrievedMedicines
) {
  return retrievedMedicines.map(
    ({ medicine, score }) => ({
      medicine:
        medicine["Medicine Name"] ||
        "Unknown medicine",

      topic:
        "Medicine Information",

      source:
        "MedCare Medicine Dataset",

      source_url:
        "",

      similarity:
        Number(score.toFixed(3))
    })
  );
}

module.exports = {
  chat
};