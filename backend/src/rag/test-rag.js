const { retrieveDocuments } = require("./retrieve");

async function test() {
  try {
    const query = "What are the side effects of metformin?";

    console.log("\nQuery:");
    console.log(query);

    const results = await retrieveDocuments(query, 3);

    console.log("\nRetrieved documents:\n");

    results.forEach((result, index) => {
      console.log(`--- Result ${index + 1} ---`);
      console.log("Medicine:", result.medicine);
      console.log("Topic:", result.topic);
      console.log("Similarity:", result.similarity.toFixed(4));
      console.log("Content:", result.content);
      console.log("Source:", result.source);
      console.log("URL:", result.source_url);
      console.log();
    });
  } catch (error) {
    console.error("RAG test failed:", error);
  }
}

test();