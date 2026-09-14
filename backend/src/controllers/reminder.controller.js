const pool = require('../config/db');

/**
 * POST /api/reminders
 * Body: { medicine_id, reminder_time, start_date, end_date }
 * user_id comes from the logged-in user (req.user.id), NOT from the body -
 * this prevents someone creating reminders for another user's account.
 */
async function createReminder(req, res) {
  try {
    const { medicine_id, reminder_time, start_date, end_date } = req.body;
    const userId = req.user.id; // from JWT via authenticate middleware

    if (!medicine_id || !reminder_time || !start_date || !end_date) {
      return res.status(400).json({
        error: 'medicine_id, reminder_time, start_date, and end_date are all required',
      });
    }

    // Confirm the medicine actually belongs to this user (basic ownership check)
    const [medicineRows] = await pool.query(
      'SELECT id FROM medicines WHERE id = ? AND user_id = ?',
      [medicine_id, userId]
    );

    if (medicineRows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found for this user' });
    }

    const [result] = await pool.query(
      `INSERT INTO reminders (user_id, medicine_id, reminder_time, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [userId, medicine_id, reminder_time, start_date, end_date]
    );

    return res.status(201).json({
      message: 'Reminder created',
      reminder: {
        id: result.insertId,
        user_id: userId,
        medicine_id,
        reminder_time,
        start_date,
        end_date,
        status: 'active',
      },
    });
  } catch (err) {
    console.error('[reminder.create] error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the reminder' });
  }
}

/**
 * GET /api/reminders
 * Returns all reminders belonging to the logged-in user
 */
async function getMyReminders(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT r.*, m.name AS medicine_name
       FROM reminders r
       JOIN medicines m ON m.id = r.medicine_id
       WHERE r.user_id = ?
       ORDER BY r.reminder_time ASC`,
      [userId]
    );

    return res.json({ reminders: rows });
  } catch (err) {
    console.error('[reminder.getMy] error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching reminders' });
  }
}

/**
 * PATCH /api/reminders/:id
 * Update status (active/inactive), reminder_time, or dates
 */
async function updateReminder(req, res) {
  try {
    const userId = req.user.id;
    const reminderId = req.params.id;
    const { reminder_time, start_date, end_date, status } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await pool.query(
      `UPDATE reminders SET
        reminder_time = COALESCE(?, reminder_time),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [reminder_time, start_date, end_date, status, reminderId]
    );

    return res.json({ message: 'Reminder updated' });
  } catch (err) {
    console.error('[reminder.update] error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the reminder' });
  }
}

/**
 * DELETE /api/reminders/:id
 */
async function deleteReminder(req, res) {
  try {
    const userId = req.user.id;
    const reminderId = req.params.id;

    const [result] = await pool.query(
      'DELETE FROM reminders WHERE id = ? AND user_id = ?',
      [reminderId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.json({ message: 'Reminder deleted' });
  } catch (err) {
    console.error('[reminder.delete] error:', err);
    return res.status(500).json({ error: 'Something went wrong deleting the reminder' });
  }
}

module.exports = { createReminder, getMyReminders, updateReminder, deleteReminder };