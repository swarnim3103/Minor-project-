const cron = require('node-cron');
const pool = require('../config/db');
const { triggerReminderCall } = require('../services/reminderService');

function startReminderScheduler() {
  cron.schedule('* * * * *', async () => {
    const [dueReminders] = await pool.query(
      `SELECT r.id, r.user_id, r.medicine_id, r.reminder_time, u.phone_number
       FROM reminders r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'active'
         AND CURDATE() BETWEEN r.start_date AND r.end_date
         AND TIME_FORMAT(r.reminder_time, '%H:%i') = TIME_FORMAT(CURTIME(), '%H:%i')`
    );

    for (const reminder of dueReminders) {
      // Prevent double-calling if already attempted today
      const [alreadyCalledToday] = await pool.query(
        `SELECT id FROM reminder_logs
         WHERE reminder_id = ? AND DATE(attempted_at) = CURDATE()`,
        [reminder.id]
      );

      if (alreadyCalledToday.length > 0) {
        continue; // already handled today, skip
      }

      console.log(`[Scheduler] Triggering reminder ${reminder.id} for user ${reminder.user_id}`);
      await triggerReminderCall(reminder);
    }
  });

  console.log('[Scheduler] Reminder scheduler started (checks every minute).');
}

module.exports = { startReminderScheduler };