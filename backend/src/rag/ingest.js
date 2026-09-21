const fs = require("fs");
const path = require("path");

const { generateEmbedding } = require("./embeddings");
const { getCollection } = require("./chroma");

const dataPath = path.join(
  __dirname,
  "data",
  "medical_data.json"
);

const medicalData = JSON.parse(
  fs.readFileSync(dataPath, "utf-8")
);

async function ingest() {
  try {
    console.log("Connecting to ChromaDB...");

    const collection = await getCollection();

    console.log(
      `Found ${medicalData.length} medical documents.`
    );

    const ids = [];
    const embeddings = [];
    const documents = [];
    const metadatas = [];

    for (const document of medicalData) {
      console.log(`Embedding: ${document.id}`);

      const text = `${document.medicine} ${document.topic} ${document.content}`;

      const embedding = await generateEmbedding(text);

      ids.push(document.id);

      embeddings.push(embedding);

      documents.push(document.content);

      metadatas.push({
        medicine: document.medicine,
        topic: document.topic,
        source: document.source,
        source_url: document.source_url
      });
    }

    await collection.upsert({
      ids,
      embeddings,
      documents,
      metadatas
    });

    console.log("\n================================");
    console.log("Medical data ingestion complete!");
    console.log("================================");

    console.log(`Documents stored: ${ids.length}`);

  } catch (error) {
    console.error("\nIngestion failed:");
    console.error(error);
  }
}

ingest();