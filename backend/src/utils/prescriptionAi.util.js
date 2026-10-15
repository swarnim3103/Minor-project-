const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.PRESCRIPTION_AI_API_KEY;
const DEFAULT_MODEL = process.env.PRESCRIPTION_AI_MODEL || 'gemini-2.0-flash';
// Optional: a stronger model used only for handwritten prescriptions
const HANDWRITTEN_MODEL = process.env.PRESCRIPTION_AI_HANDWRITTEN_MODEL || DEFAULT_MODEL;
console.log('[prescriptionAi] Models -> default:', DEFAULT_MODEL, '| handwritten:', HANDWRITTEN_MODEL);

const BASE_PROMPT = `You are extracting information from a medical prescription for a patient's personal records app.
Read the attached prescription and return ONLY a JSON object in exactly this structure:

{
  "legibility": "clear",
  "medications": [
    {
      "name": "string",
      "dosage": "string or null",
      "frequency": "string or null",
      "timing": "string or null",
      "duration": "string or null",
      "notes": "string or null",
      "confidence": "high"
    }
  ],
  "other_instructions": ["string"],
  "unclear": false
}

Field rules:
- name: the medicine name, e.g. "Augmentin"
- dosage: strength, e.g. "625 mg". null if not written.
- frequency: how often, e.g. "Twice daily"
- timing: when to take it, e.g. "Morning and night, after meals"
- duration: how long, e.g. "5 days" or "1 week"
- notes: any extra detail, e.g. "Massage onto gums". null if none.
- confidence: "high" if you read the medicine clearly, "medium" if some letters were uncertain, "low" if mostly guessed.
- legibility: "clear", "partly_legible", or "hard_to_read" for the document as a whole.
- other_instructions: anything that is not a medicine (tests, rest, follow-up). Empty array if none.
- unclear: true ONLY if the document is unreadable or does not look like a prescription.
- Use null for anything not clearly written. Never invent values.
- Return only the JSON, with no markdown and no extra text.`;

const HANDWRITTEN_ADDENDUM = `This prescription is HANDWRITTEN, so read it with extra care:
- Look at the whole page first, then work out each line using the surrounding context.
- Doctors use abbreviations. Interpret them: OD/QD = once daily; BD/BID = twice daily; TDS/TID = three times daily; QID = four times daily; HS = at bedtime; SOS/PRN = only if needed; AC = before meals; PC = after meals; Tab = tablet; Cap = capsule; Syp = syrup; Inj = injection. A pattern like 1-0-1 means morning and night, 1-1-1 means morning, afternoon and night, and 0-0-1 means night only.
- If a medicine name is only partly legible but clearly matches a real medicine, use that name and set its confidence to "medium" or "low".
- If you cannot read a word with reasonable certainty, do NOT guess. Leave that field null (or leave that medicine out) and set "legibility" to "partly_legible" or "hard_to_read".
- Never replace a name with a different well-known medicine just because it looks similar.`;

const str = (value, max) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

// Coerces any input into the exact summary shape. Used for AI output AND manual edits.
function sanitizeSummary(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.medications)) return null;

  const medications = input.medications
    .slice(0, 30)
    .map((m) => ({
      name: str(m?.name, 150),
      dosage: str(m?.dosage, 100),
      frequency: str(m?.frequency, 100),
      timing: str(m?.timing, 150),
      duration: str(m?.duration, 100),
      notes: str(m?.notes, 300),
      confidence: ['high', 'medium', 'low'].includes(m?.confidence) ? m.confidence : null,
    }))
    .filter((m) => m.name);

  const other_instructions = Array.isArray(input.other_instructions)
    ? input.other_instructions.map((s) => str(s, 300)).filter(Boolean).slice(0, 30)
    : [];

  const legibility = ['clear', 'partly_legible', 'hard_to_read'].includes(input.legibility)
    ? input.legibility
    : null;

  return { legibility, medications, other_instructions, unclear: Boolean(input.unclear) };
}

async function generatePrescriptionSummary(pdfFilePath, prescriptionType) {
  if (!API_KEY) {
    throw new Error('PRESCRIPTION_AI_API_KEY is not set');
  }

  const isHandwritten = prescriptionType === 'handwritten_scanned';
  const model = isHandwritten ? HANDWRITTEN_MODEL : DEFAULT_MODEL;
  const prompt = isHandwritten ? `${BASE_PROMPT}\n\n${HANDWRITTEN_ADDENDUM}` : BASE_PROMPT;

  const base64Pdf = fs.readFileSync(pdfFilePath).toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    let text = parts.map((p) => p.text).filter(Boolean).join('');
    if (!text) throw new Error('Gemini did not return a summary');

    // Strip markdown fences if the model adds them anyway
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const cleaned = sanitizeSummary(JSON.parse(text));
    if (!cleaned) throw new Error('Gemini returned an unexpected format');
    return cleaned;
  } catch (err) {
    if (err.response) {
      console.error('[prescriptionAi] Gemini API error response:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

module.exports = { generatePrescriptionSummary, sanitizeSummary };