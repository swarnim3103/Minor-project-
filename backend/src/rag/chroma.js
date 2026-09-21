const { ChromaClient } = require("chromadb");

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false
});

async function getCollection() {
  const collection = await client.getOrCreateCollection({
    name: "medcare_medical_knowledge",
    embeddingFunction: null,
    metadata: {
      "hnsw:space": "cosine"
    }
  });

  return collection;
}

module.exports = {
  client,
  getCollection
};