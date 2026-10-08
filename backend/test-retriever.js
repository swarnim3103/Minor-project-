const {
  retrieveMedicines
} = require("./src/rag/retriever");

const query = "tell me about paracetamol";

console.log(`\nQuery: ${query}\n`);

const results = retrieveMedicines(query, 5);

if (!results.length) {
  console.log("No medicines found.");
  process.exit(0);
}

results.forEach((result, index) => {
  const medicine = result.medicine;

  console.log(
    `${index + 1}. ${medicine["Medicine Name"]} - ${result.score.toFixed(3)}`
  );

  console.log(
    `   Composition: ${medicine["Composition"] || "N/A"}`
  );

  console.log(
    `   Uses: ${medicine["Uses"] || "N/A"}`
  );

  console.log(
    `   Side Effects: ${medicine["Side_effects"] || "N/A"}`
  );

  console.log();
});