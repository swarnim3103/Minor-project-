const { pipeline } = require("@huggingface/transformers");

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    console.log("Loading embedding model...");

    extractor = await pipeline(
      "feature-extraction",
      "Xenova/gte-small"
    );

    console.log("Embedding model loaded.");
  }

  return extractor;
}

async function generateEmbedding(text) {
  const model = await getExtractor();

  const output = await model(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(output.data);
}

module.exports = {
  generateEmbedding
};