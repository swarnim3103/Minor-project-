const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(
  __dirname,

  "..",
  "data",
  "Medicine_Details.csv"
);

let medicines = [];

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function loadDataset() {
  if (medicines.length > 0) {
    return medicines;
  }

  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(
      `Medicine dataset not found at: ${DATASET_PATH}`
    );
  }

  const csv = fs.readFileSync(DATASET_PATH, "utf8");

  const lines = csv
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("Medicine dataset is empty.");
  }

  const headers = parseCSVLine(lines[0]);

  medicines = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const medicine = {};

    headers.forEach((header, index) => {
      medicine[header] = values[index] || "";
    });

    return {
      ...medicine,
      normalizedName: normalizeText(
        medicine["Medicine Name"]
      ),
      normalizedComposition: normalizeText(
        medicine["Composition"]
      ),
      normalizedUses: normalizeText(
        medicine["Uses"]
      ),
      normalizedSideEffects: normalizeText(
        medicine["Side_effects"]
      )
    };
  });

  console.log(
    `Medicine dataset loaded: ${medicines.length} medicines`
  );

  return medicines;
}

function getMedicines() {
  return loadDataset();
}

module.exports = {
  loadDataset,
  getMedicines,
  normalizeText
};