const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateMedicalAnswer(query, documents) {
  const context = documents
    .map((doc, index) => {
      return `
SOURCE ${index + 1}
Medicine: ${doc.medicine}
Topic: ${doc.topic}
Information: ${doc.content}
Source: ${doc.source}
Source URL: ${doc.source_url}
`;
    })
    .join("\n");

  const prompt = `
You are a medical information assistant for MedCare.

Your job is to provide safe, factual information about medicines
and general medication-related topics.

USER QUESTION:
${query}

RETRIEVED MEDICAL INFORMATION:
${context}

STRICT RULES:

1. Use only the retrieved medical information provided above.
2. Do not invent medical facts.
3. Do not diagnose diseases.
4. Do not prescribe medicines.
5. Do not recommend changing a medication dose.
6. Do not tell the user to stop a prescribed medicine.
7. Do not make assumptions about the user's medical condition.
8. If the retrieved information does not adequately answer the question,
   clearly say that reliable information is not available in the
   provided medical knowledge base.
9. For potentially serious symptoms or urgent medication reactions,
   advise the user to seek appropriate medical attention.
10. Keep the answer clear and easy to understand.
11. Mention the relevant source after the information.

Answer the user's question now.
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You are a safe, evidence-grounded medical information assistant."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 500
  });

  return completion.choices[0].message.content;
}

module.exports = {
  generateMedicalAnswer
};