const pool = require('../db');

async function getUserContext(userId) {
  const [[user]] = await pool.query(
    'SELECT name FROM users WHERE id = ?', [userId]
  );

  // Only medicines still active (no end date, or end date not passed)
  const [meds] = await pool.query(
    `SELECT name, dosage, frequency, instructions, start_date, end_date
     FROM medicines
     WHERE user_id = ? AND (end_date IS NULL OR end_date >= CURDATE())
     ORDER BY start_date DESC LIMIT 30`,
    [userId]
  );

  const [rx] = await pool.query(
    `SELECT doctor_name, prescription_date, ai_summary
     FROM prescriptions
     WHERE user_id = ? AND ai_summary_status = 'completed'
     ORDER BY prescription_date DESC LIMIT 5`,
    [userId]
  );

  const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');

  const medTable = meds.length
    ? '| Medicine | Dosage | Frequency | Instructions | Start | End |\n|---|---|---|---|---|---|\n' +
      meds.map(m =>
        `| ${m.name} | ${m.dosage || '-'} | ${m.frequency || '-'} | ${m.instructions || '-'} | ${fmt(m.start_date)} | ${fmt(m.end_date)} |`
      ).join('\n')
    : 'No active medicines on file.';

  const rxText = rx.length
    ? rx.map(r => `- ${fmt(r.prescription_date)}, Dr. ${r.doctor_name || 'unknown'}: ${(r.ai_summary || '').slice(0, 800)}`).join('\n')
    : 'No prescription summaries on file.';

  return { name: user?.name || 'User', medTable, rxText };
}

module.exports = { getUserContext };