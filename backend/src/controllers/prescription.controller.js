const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { generatePrescriptionSummary, sanitizeSummary } = require('../utils/prescriptionAi.util');

async function uploadPrescription(req, res) {
  try {
    const userId = req.user.id;
    const { doctor_name, prescription_date, prescription_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'A PDF file is required' });
    }

    if (!doctor_name || !prescription_date) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'doctor_name and prescription_date are required' });
    }

    const validTypes = ['online', 'scanned_physical', 'handwritten_scanned'];
    const type = validTypes.includes(prescription_type) ? prescription_type : 'scanned_physical';

    const relativePath = `/uploads/prescriptions/${req.file.filename}`;

    // Generate the AI summary before saving, so the summary is ready
    // as soon as the upload response comes back. A failure here doesn't
    // block the upload — it just leaves ai_summary_status = 'failed'.
let aiSummary = null;
let aiSummaryStatus = 'failed';
try {
  console.log('[prescription.upload] Calling AI summary generation...');
  const summaryData = await generatePrescriptionSummary(req.file.path, type);
  aiSummary = JSON.stringify(summaryData);
  aiSummaryStatus = 'completed';
} catch (aiErr) {
  console.error('[prescription.upload] AI summary generation failed:', aiErr.message);
}

    const [result] = await pool.query(
      `INSERT INTO prescriptions
        (user_id, file_url, doctor_name, prescription_date, prescription_type, original_filename, ai_summary, ai_summary_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, relativePath, doctor_name, prescription_date, type, req.file.originalname, aiSummary, aiSummaryStatus]
    );

    return res.status(201).json({
      message: 'Prescription uploaded successfully',
      prescription: {
        id: result.insertId,
        doctor_name,
        prescription_date,
        prescription_type: type,
        file_url: relativePath,
        original_filename: req.file.originalname,
        ai_summary: aiSummary,
        ai_summary_status: aiSummaryStatus,
      },
    });
  } catch (err) {
    console.error('[prescription.upload] error:', err);
    return res.status(500).json({ error: 'Failed to upload prescription' });
  }
}

async function getPrescriptions(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, doctor_name, prescription_date, prescription_type, file_url, original_filename,
              ai_summary, ai_summary_status, summary_edited, created_at
       FROM prescriptions
       WHERE user_id = ?
       ORDER BY prescription_date DESC`,
      [userId]
    );

    return res.json({
      prescriptions: rows.map((r) => ({ ...r, summary_edited: !!r.summary_edited })),
    });
  } catch (err) {
    console.error('[prescription.get] error:', err);
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
}

async function deletePrescription(req, res) {
  try {
    const userId = req.user.id;
    const prescriptionId = req.params.id;

    const [rows] = await pool.query(
      'SELECT file_url FROM prescriptions WHERE id = ? AND user_id = ?',
      [prescriptionId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const filePath = path.join(__dirname, '..', rows[0].file_url);

    await pool.query('DELETE FROM prescriptions WHERE id = ? AND user_id = ?', [prescriptionId, userId]);

    fs.unlink(filePath, (err) => {
      if (err) console.warn('[prescription.delete] Could not delete file from disk:', err.message);
    });

    return res.json({ message: 'Prescription deleted' });
  } catch (err) {
    console.error('[prescription.delete] error:', err);
    return res.status(500).json({ error: 'Failed to delete prescription' });
  }
}
// PUT /api/prescriptions/:id/summary  - save a manually written/edited summary
async function updateSummary(req, res) {
  try {
    const userId = req.user.id;
    const prescriptionId = req.params.id;

    const [rows] = await pool.query(
      'SELECT id FROM prescriptions WHERE id = ? AND user_id = ?',
      [prescriptionId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const cleaned = sanitizeSummary(req.body);
    if (!cleaned || (cleaned.medications.length === 0 && cleaned.other_instructions.length === 0)) {
      return res.status(400).json({ error: 'Add at least one medicine or instruction' });
    }

    // The user has reviewed this, so clear the AI's uncertainty markers
    cleaned.legibility = null;
    cleaned.unclear = false;
    cleaned.medications = cleaned.medications.map((m) => ({ ...m, confidence: null }));

    const aiSummary = JSON.stringify(cleaned);

    await pool.query(
      `UPDATE prescriptions
       SET ai_summary = ?, ai_summary_status = 'completed', summary_edited = 1
       WHERE id = ? AND user_id = ?`,
      [aiSummary, prescriptionId, userId]
    );

    return res.json({
      message: 'Summary saved',
      ai_summary: aiSummary,
      ai_summary_status: 'completed',
      summary_edited: true,
    });
  } catch (err) {
    console.error('[prescription.updateSummary] error:', err);
    return res.status(500).json({ error: 'Failed to save summary' });
  }
}

// POST /api/prescriptions/:id/regenerate-summary  - re-run the AI on the stored file
async function regenerateSummary(req, res) {
  try {
    const userId = req.user.id;
    const prescriptionId = req.params.id;

    const [rows] = await pool.query(
      `SELECT file_url, prescription_type, summary_edited
       FROM prescriptions WHERE id = ? AND user_id = ?`,
      [prescriptionId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const row = rows[0];

    // Never silently overwrite something the user edited
    if (row.summary_edited && !req.body?.overwrite) {
      return res.status(409).json({ error: 'This summary was edited by you. Confirm to replace it.' });
    }

    const filePath = path.join(__dirname, '..', row.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'The prescription file is missing on the server' });
    }

    let summaryData;
    try {
      summaryData = await generatePrescriptionSummary(filePath, row.prescription_type);
    } catch (aiErr) {
      console.error('[prescription.regenerate] AI summary generation failed:', aiErr.message);
      return res.status(502).json({
        error: 'The AI could not read this prescription. Try again, or add the summary manually.',
      });
    }

    const aiSummary = JSON.stringify(summaryData);

    await pool.query(
      `UPDATE prescriptions
       SET ai_summary = ?, ai_summary_status = 'completed', summary_edited = 0
       WHERE id = ? AND user_id = ?`,
      [aiSummary, prescriptionId, userId]
    );

    return res.json({
      message: 'Summary regenerated',
      ai_summary: aiSummary,
      ai_summary_status: 'completed',
      summary_edited: false,
    });
  } catch (err) {
    console.error('[prescription.regenerate] error:', err);
    return res.status(500).json({ error: 'Failed to regenerate summary' });
  }
}

module.exports = {
  uploadPrescription,
  getPrescriptions,
  deletePrescription,
  updateSummary,
  regenerateSummary,
};