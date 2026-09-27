const fs = require("fs");

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function loadStore(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw); // [{ text, embedding, source }]
}

function saveStore(filePath, records) {
  fs.writeFileSync(filePath, JSON.stringify(records));
}

function search(store, queryEmbedding, topK = 4) {
  const scored = store.map((record) => ({
    ...record,
    score: cosineSimilarity(record.embedding, queryEmbedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { cosineSimilarity, loadStore, saveStore, search };