const { generateEmbedding } = require("./embeddings");
const { getCollection } = require("./chroma");

async function retrieveDocuments(query, topK = 3) {
  try {
    const collection = await getCollection();

    console.log("Generating query embedding...");

    const queryEmbedding = await generateEmbedding(query);

    console.log("Searching ChromaDB...");

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: [
        "documents",
        "metadatas",
        "distances"
      ]
    });

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];
    const ids = results.ids?.[0] || [];

    return documents.map((content, index) => {
      const metadata = metadatas[index] || {};
      const distance = distances[index] ?? 0;

      return {
        id: ids[index],

        medicine: metadata.medicine,
        topic: metadata.topic,

        content,

        source: metadata.source,
        source_url: metadata.source_url,

        // Chroma cosine distance = 1 - cosine similarity
        similarity: 1 - distance
      };
    });

  } catch (error) {
    console.error("ChromaDB retrieval error:");
    console.error(error);

    throw error;
  }
}

module.exports = {
  retrieveDocuments
};