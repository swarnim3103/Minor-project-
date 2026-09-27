// Run once (or whenever the book changes):
//   node src/rag/ingest.js
// (defaults to the medicine_book.pdf already sitting in this folder;
//  pass a different path as an argument to override)
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { embedBatch } = require("./embed");
const { saveStore } = require("./vectorstore");

const PDF_PATH = process.argv[2] || path.join(__dirname, "medicine_book.pdf");
const OUTPUT_PATH = path.join(__dirname, "data", "embeddings.json");
const CHUNK_WORDS = 300;
const OVERLAP_WORDS = 50;

function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORDS, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += CHUNK_WORDS - OVERLAP_WORDS;
  }
  return chunks;
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`Could not find PDF at ${PDF_PATH}`);
    console.error("Usage: node src/rag/ingest.js [path/to/book.pdf]");
    process.exit(1);
  }

  console.log(`Reading PDF from ${PDF_PATH} ...`);
  const dataBuffer = fs.readFileSync(PDF_PATH);
  const parsed = await pdf(dataBuffer);
  console.log(`Extracted ${parsed.text.length} characters from ${parsed.numpages} pages.`);

  console.log("Chunking text...");
  const chunks = chunkText(parsed.text);
  console.log(`Created ${chunks.length} chunks.`);

  console.log("Generating embeddings locally (this may take a while for a big book)...");
  const vectors = await embedBatch(chunks, (done, total) => {
    if (done % 20 === 0 || done === total) {
      process.stdout.write(`\rEmbedded ${done}/${total} chunks`);
    }
  });
  console.log("\nDone embedding.");

  const records = chunks.map((text, i) => ({
    text,
    embedding: vectors[i],
    source: `chunk_${i}`,
  }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  saveStore(OUTPUT_PATH, records);
  console.log(`Saved ${records.length} records to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});