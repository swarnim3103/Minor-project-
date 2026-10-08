const { generateAnswer } = require("./gemini");

function buildHistory(history) {
  return history
    .slice(-8)
    .map((message) => {
      const role =
        message.role === "assistant"
          ? "Assistant"
          : "User";

      return `${role}: ${message.content}`;
    })
    .join("\n");
}

function needsResolution(question, history) {
  if (!history || history.length === 0) {
    return false;
  }

  const lower = question.toLowerCase();

  const contextualWords = [
    "it",
    "its",
    "this",
    "that",
    "they",
    "them",
    "their",
    "these",
    "those",
    "same medicine",
    "same drug"
  ];

  return contextualWords.some((word) =>
    lower.includes(word)
  );
}

async function resolveQuery(question, history = []) {
  const originalQuestion = question.trim();

  if (!originalQuestion) {
    return originalQuestion;
  }

  if (!needsResolution(originalQuestion, history)) {
    return originalQuestion;
  }

  const conversation = buildHistory(history);

  const prompt = `
You are the query-resolution component of MedCare,
a medical medicine-information chatbot.

Your task is to rewrite the user's latest question into
a self-contained search query.

CONVERSATION:
${conversation}

LATEST USER QUESTION:
${originalQuestion}

RULES:

1. Resolve pronouns such as "it", "its", "this medicine",
   "that medicine", "they", and "their" using the conversation.

2. Use the previously mentioned medicine name when
   the latest question depends on it.

3. Preserve the user's exact intent.

4. Do not answer the question.

5. Do not add medical facts.

6. Do not invent a medicine name.

7. If the latest question is already clear from the
   conversation, rewrite it into a self-contained query.

8. Return ONLY the rewritten search query.

REWRITTEN QUERY:
`;

  try {
    const resolved = await generateAnswer(prompt);

    if (!resolved) {
      return originalQuestion;
    }

    return resolved
      .replace(/^["']|["']$/g, "")
      .trim();
  } catch (error) {
    console.error(
      "Query resolution failed:",
      error.message
    );

    return originalQuestion;
  }
}

module.exports = {
  resolveQuery,
  needsResolution
};