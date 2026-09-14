const pool = require("../config/db");

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    // 1. Active medicines
    const [medicineCount] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM medicines
      WHERE user_id = ?
        AND (start_date IS NULL OR start_date <= CURDATE())
        AND (end_date IS NULL OR end_date >= CURDATE())
      `,
      [userId]
    );

    // 2. Today's reminders
    const [todaysReminders] = await pool.query(
      `
      SELECT
        r.id,
        m.name AS medicine_name,
        TIME_FORMAT(r.reminder_time, '%H:%i') AS reminder_time,
        r.status,
        CONCAT(
          COALESCE(m.dosage, ''),
          CASE
            WHEN m.instructions IS NOT NULL
            THEN CONCAT(' ', m.instructions)
            ELSE ''
          END
        ) AS dosage
      FROM reminders r
      JOIN medicines m ON r.medicine_id = m.id
      WHERE r.user_id = ?
        AND r.status = 'active'
        AND (r.start_date IS NULL OR r.start_date <= CURDATE())
        AND (r.end_date IS NULL OR r.end_date >= CURDATE())
      ORDER BY r.reminder_time ASC
      `,
      [userId]
    );

    // 3. Recently added medicines
    const [recentMedicines] = await pool.query(
      `
      SELECT
        id,
        name,
        dosage,
        frequency,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date
      FROM medicines
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    // 4. Missed reminders this week
    const [missedReminders] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM reminder_logs rl
      JOIN reminders r ON rl.reminder_id = r.id
      WHERE r.user_id = ?
        AND rl.status = 'missed'
        AND rl.attempted_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      [userId]
    );

    // 5. Adherence for last 30 days
    const [adherence] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN rl.status = 'taken' THEN 1 ELSE 0 END) AS taken
      FROM reminder_logs rl
      JOIN reminders r ON rl.reminder_id = r.id
      WHERE r.user_id = ?
        AND rl.attempted_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `,
      [userId]
    );

    const total = adherence[0].total;
    const taken = adherence[0].taken || 0;

    const adherenceRate =
      total > 0 ? Math.round((taken / total) * 100) : 0;

    return res.json({
      stats: {
        activeMedicines: medicineCount[0].count,
        remindersToday: todaysReminders.length,
        adherenceRate,
        missedThisWeek: missedReminders[0].count,
      },

      todaysReminders,

      recentMedicines,
    });
  } catch (error) {
    console.error("[dashboard] error:", error);

    return res.status(500).json({
      error: "Failed to fetch dashboard data",
    });
  }
}

module.exports = { getDashboard };