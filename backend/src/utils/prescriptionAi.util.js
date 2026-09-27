const axios = require('axios');
const fs = require('fs');

// Dedicated to prescription summarization only — separate API key/model
// from anything used by the chatbot feature.
const PRESCRIPTION_AI_API_KEY = process.env.PRESCRIPTION_AI_API_KEY;
const PRESCRIPTION_AI_MODEL = process.env.PRESCRIPTION_AI_MODEL || 'gemini-2.0-flash';
console.log('[prescriptionAi] Using model:', PRESCRIPTION_AI_MODEL);

const SUMMARY_PROMPT = `You are summarizing a medical prescription for a patient's personal records app.
Read the attached prescription PDF and write a short, patient-friendly summary in 2-3 sentences covering:
- The medicine(s) prescribed
- Dosage / frequency instructions, if visible
- Any special notes (e.g. "take after food")
If the document is unclear, low quality, or doesn't look like a prescription, say so briefly instead of guessing.`;

async function generatePrescriptionSummary(pdfFilePath) {
  if (!PRESCRIPTION_AI_API_KEY) {
    throw new Error('PRESCRIPTION_AI_API_KEY is not set');
  }

  const pdfBuffer = fs.readFileSync(pdfFilePath);
  const base64Pdf = pdfBuffer.toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRESCRIPTION_AI_MODEL}:generateContent?key=${PRESCRIPTION_AI_API_KEY}`;

  console.log('[prescriptionAi] Calling URL:', url.replace(PRESCRIPTION_AI_API_KEY, 'REDACTED'));

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: SUMMARY_PROMPT },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
            ],
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini did not return a summary');
    }

    return text.trim();
  } catch (err) {
    // Log the ACTUAL response body from Google, not just the status code
    if (err.response) {
      console.error('[prescriptionAi] Gemini API error response:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}
module.exports = { generatePrescriptionSummary };