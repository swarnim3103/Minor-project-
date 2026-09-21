require("dotenv").config();

const { retrieveDocuments } = require("./retrieve");
const { generateMedicalAnswer } = require("./groq");

async function test() {
  try {
    const query = "What are the side effects of metformin?";

    console.log("\nUser Question:");
    console.log(query);

    console.log("\nRetrieving medical information...");

    const documents = await retrieveDocuments(query, 3);

    console.log("\nGenerating answer with Groq...");

    const answer = await generateMedicalAnswer(
      query,
      documents
    );

    console.log("\n==============================");
    console.log("MEDICAL CHATBOT ANSWER");
    console.log("==============================\n");

    console.log(answer);

    console.log("\n==============================");
    console.log("RETRIEVED SOURCES");
    console.log("==============================\n");

    documents.forEach((doc, index) => {
      console.log(
        `${index + 1}. ${doc.source} - ${doc.source_url}`
      );
    });
  } catch (error) {
    console.error("\nGroq/RAG test failed:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

test();