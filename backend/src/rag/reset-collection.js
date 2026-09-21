const { client } = require("./chroma");

async function resetCollection() {
  try {
    console.log("Deleting old collection...");

    try {
      await client.deleteCollection({
        name: "medcare_medical_knowledge"
      });

      console.log("Old collection deleted.");
    } catch (error) {
      console.log("Collection did not exist yet.");
    }

    console.log("Collection reset complete.");

  } catch (error) {
    console.error("Reset failed:");
    console.error(error);
  }
}

resetCollection();