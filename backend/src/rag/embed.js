// Local, free embeddings via a small transformer model.
// @xenova/transformers is ESM-only, so we load it with a dynamic import()
// even though this file is CommonJS.

let embedderPromise = null;

async function getEmbedder() {
  if (!embedderPromise) {
    const { pipeline } = await import("@xenova/transformers");
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function embedBatch(texts, onProgress) {
  const vectors = [];
  for (let i = 0; i < texts.length; i++) {
    vectors.push(await embedText(texts[i]));
    if (onProgress) onProgress(i + 1, texts.length);
  }
  return vectors;
}

module.exports = { embedText, embedBatch };