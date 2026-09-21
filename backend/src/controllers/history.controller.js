const pool = require('../config/db');

const TAKEN_STATUSES = ['completed'];

async function getHistory(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         rl.id,
         rl.status,
         rl.attempted_at,
         r.reminder_time,
         m.name AS medicine_name
       FROM reminder_logs rl
       JOIN reminders r ON r.id = rl.reminder_id
       JOIN medicines m ON m.id = r.medicine_id
       WHERE r.user_id = ?
       ORDER BY rl.attempted_at DESC
       LIMIT 50`,
      [userId]
    );

    const mapped = rows.map((row) => ({
      date: row.attempted_at.toISOString().slice(0, 10),
      medicine: row.medicine_name,
      time: row.reminder_time.slice(0, 5),
      status: TAKEN_STATUSES.includes(row.status) ? 'taken' : 'missed',
    }));

    return res.json({ history: mapped });
  } catch (err) {
    console.error('[history.get] error:', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}

async function getAdherence(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         DATE(rl.attempted_at) AS log_date,
         SUM(CASE WHEN rl.status = 'completed' THEN 1 ELSE 0 END) AS taken_count,
         COUNT(*) AS total_count
       FROM reminder_logs rl
       JOIN reminders r ON r.id = rl.reminder_id
       WHERE r.user_id = ?
         AND rl.attempted_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(rl.attempted_at)`,
      [userId]
    );

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const match = rows.find((r) => r.log_date.toISOString().slice(0, 10) === dateStr);
      const pct = match && match.total_count > 0
        ? Math.round((match.taken_count / match.total_count) * 100)
        : 0;

      result.push({ day: dayLabels[d.getDay()], pct });
    }

    return res.json({ adherence: result });
  } catch (err) {
    console.error('[history.adherence] error:', err);
    return res.status(500).json({ error: 'Failed to fetch adherence data' });
  }
}

module.exports = { getHistory, getAdherence };