const { isMedicalQuery } = require("./medicalGuard");

const queries = [
  "What are the side effects of metformin?",
  "Can I take ibuprofen with another medicine?",
  "What is the capital of France?",
  "How do I create a React website?",
  "I missed my medicine dose, what should I do?",
  "Tell me a joke"
];

queries.forEach((query) => {
  console.log(
    `${isMedicalQuery(query) ? "MEDICAL" : "NON-MEDICAL"} → ${query}`
  );
});
