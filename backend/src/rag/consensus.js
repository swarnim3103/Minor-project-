function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccardSimilarity(text1, text2) {
  const set1 = new Set(tokenize(text1));
  const set2 = new Set(tokenize(text2));

  if (set1.size === 0 && set2.size === 0) {
    return 1;
  }

  if (set1.size === 0 || set2.size === 0) {
    return 0;
  }

  const intersection = [...set1].filter((word) =>
    set2.has(word)
  );

  const union = new Set([
    ...set1,
    ...set2
  ]);

  return intersection.length / union.size;
}

function verifyAnswers(
  geminiAnswer,
  groqAnswer,
  threshold = 0.55
) {
  const similarity = jaccardSimilarity(
    geminiAnswer,
    groqAnswer
  );

  const verified = similarity >= threshold;

  if (verified) {
    return {
      verified: true,
      similarity,
      answer: geminiAnswer,
      message: null
    };
  }

  return {
    verified: false,
    similarity,
    answer: null,
    message:
      "The available information produced conflicting answers, so I cannot provide a reliable response. Please consult a qualified doctor or pharmacist for advice about this medicine."
  };
}

module.exports = {
  jaccardSimilarity,
  verifyAnswers
};