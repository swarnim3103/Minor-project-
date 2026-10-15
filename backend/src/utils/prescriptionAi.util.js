const axios = require('axios');
const fs = require('fs');

const PRESCRIPTION_AI_API_KEY = process.env.PRESCRIPTION_AI_API_KEY;
const PRESCRIPTION_AI_MODEL = process.env.PRESCRIPTION_AI_MODEL || 'gemini-2.0-flash';
console.log('[prescriptionAi] Using model:', PRESCRIPTION_AI_MODEL);

const SUMMARY_PROMPT = `You are extracting information from a medical prescription for a patient's personal records app.
Read the attached prescription PDF and return ONLY a JSON object in exactly this structure:

{
  "medications": [
    {
      "name": "string",
      "dosage": "string or null",
      "frequency": "string or null",
      "timing": "string or null",
      "duration": "string or null",
      "notes": "string or null"
    }
  ],
  "other_instructions": ["string"],
  "unclear": false
}

Field rules:
- name: the medicine name, e.g. "Augmentin"
- dosage: strength, e.g. "625 mg". null if not written.
- frequency: how often, e.g. "Twice daily" or "Once daily"
- timing: when to take it, e.g. "Morning and night, after meals" or "Morning, before meals"
- duration: how long, e.g. "5 days" or "1 week"
- notes: any extra detail, e.g. "Massage onto gums" for a gum paint. null if none.
- other_instructions: anything that is not a medicine (tests, rest, follow-up). Empty array if none.
- unclear: true ONLY if the document is unreadable or does not look like a prescription.
- Use null for anything not clearly written. Never guess or invent values.
- Return only the JSON, with no markdown and no extra text.`;

async function generatePrescriptionSummary(pdfFilePath) {
  if (!PRESCRIPTION_AI_API_KEY) {
    throw new Error('PRESCRIPTION_AI_API_KEY is not set');
  }

  const pdfBuffer = fs.readFileSync(pdfFilePath);
  const base64Pdf = pdfBuffer.toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRESCRIPTION_AI_MODEL}:generateContent?key=${PRESCRIPTION_AI_API_KEY}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: SUMMARY_PROMPT },
              { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini did not return a summary');

    // Strip markdown code fences if the model adds them anyway
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.medications)) {
      throw new Error('Gemini returned an unexpected format');
    }
    return parsed;
  } catch (err) {
    if (err.response) {
      console.error('[prescriptionAi] Gemini API error response:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

module.exports = { generatePrescriptionSummary };