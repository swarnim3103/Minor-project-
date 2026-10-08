const {
  getMedicines,
  normalizeText
} = require("./dataset");

const STOP_WORDS = new Set([
  "tell",
  "me",
  "about",
  "what",
  "is",
  "are",
  "the",
  "of",
  "for",
  "give",
  "information",
  "information",
  "on",
  "can",
  "you",
  "please",
  "explain",
  "medicine",
  "drug"
]);

function tokenize(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9\s+-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function cleanQuery(query) {
  const tokens = tokenize(query);

  return tokens
    .filter((token) => !STOP_WORDS.has(token))
    .join(" ")
    .trim();
}

function exactNameMatch(query, medicineName) {
  const q = normalizeText(query);
  const name = normalizeText(medicineName);

  return q === name;
}

function startsWithName(query, medicineName) {
  const q = normalizeText(query);
  const name = normalizeText(medicineName);

  return name.startsWith(q);
}

function tokenMatchScore(query, medicineName) {
  const queryTokens = tokenize(query);
  const nameTokens = tokenize(medicineName);

  if (!queryTokens.length || !nameTokens.length) {
    return 0;
  }

  let matched = 0;

  for (const token of queryTokens) {
    if (nameTokens.includes(token)) {
      matched++;
    }
  }

  return matched / queryTokens.length;
}

function compositionMatch(query, composition) {
  const queryTokens = tokenize(query);
  const compositionTokens = tokenize(composition);

  if (!queryTokens.length || !compositionTokens.length) {
    return 0;
  }

  let matched = 0;

  for (const token of queryTokens) {
    if (compositionTokens.includes(token)) {
      matched++;
    }
  }

  return matched / queryTokens.length;
}

function calculateScore(query, medicine) {
  const cleanedQuery = cleanQuery(query);

  if (!cleanedQuery) {
    return 0;
  }

  const name = medicine.normalizedName || "";
  const composition = medicine.normalizedComposition || "";
  const uses = medicine.normalizedUses || "";

  let score = 0;

  const exact = exactNameMatch(cleanedQuery, name);
  const startsWith = startsWithName(cleanedQuery, name);

  const nameTokenScore = tokenMatchScore(
    cleanedQuery,
    name
  );

  const compScore = compositionMatch(
    cleanedQuery,
    composition
  );

  const queryTokens = tokenize(cleanedQuery);

  const queryAppearsInName =
    queryTokens.length > 0 &&
    queryTokens.every((token) => name.includes(token));

  const isCombination =
    name.includes("+") ||
    name.includes("/") ||
    name.includes("combination");

  if (exact) {
    score += 100;
  }

  if (startsWith) {
    score += 50;
  }

  if (queryAppearsInName) {
    score += 35;
  }

  score += nameTokenScore * 30;

  score += compScore * 15;

  if (
    uses.includes(cleanedQuery) ||
    cleanedQuery.split(" ").some((token) =>
      uses.includes(token)
    )
  ) {
    score += 5;
  }

  if (isCombination && !cleanedQuery.includes("+")) {
    score -= 20;
  }

  return score;
}

function retrieve(query, limit = 5) {
  const medicines = getMedicines();

  const results = medicines
    .map((medicine) => ({
      medicine,
      score: calculateScore(query, medicine)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

function retrieveMedicines(query, limit = 5) {
  return retrieve(query, limit).map(
    ({ medicine, score }) => ({
      medicine,
      score
    })
  );
}

module.exports = {
  retrieve,
  retrieveMedicines,
  cleanQuery,
  calculateScore
};