const pool = require("../config/db");

// =========================================================
// HELPER: CONVERT MEDICINE FREQUENCY TO REMINDER FREQUENCY
// =========================================================

function getReminderFrequency(medicineFrequency) {
  const dailyFrequencies = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
  ];

  if (dailyFrequencies.includes(medicineFrequency)) {
    return "daily";
  }

  if (medicineFrequency === "Weekly") {
    return "weekly";
  }

  return null;
}

// =========================================================
// HELPER: GET DAY OF WEEK
// Sunday = 0
// Monday = 1
// Tuesday = 2
// ...
// Saturday = 6
// =========================================================

function getDayOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);

  // Convert JavaScript's 0-6 format
  // to MySQL's 1-7 format:
  //
  // JavaScript:
  // Sunday = 0
  // Monday = 1
  // ...
  // Saturday = 6
  //
  // MySQL:
  // Sunday = 1
  // Monday = 2
  // ...
  // Saturday = 7

  return date.getUTCDay() + 1;
}

// =========================================================
// CREATE REMINDER
// =========================================================

async function createReminder(req, res) {
  try {
    const {
      medicine_id,
      reminder_times,
    } = req.body;

    const userId = req.user.id;

    // -----------------------------------------
    // Basic validation
    // -----------------------------------------

    if (!medicine_id || !Array.isArray(reminder_times)) {
      return res.status(400).json({
        error: "medicine_id and reminder_times are required",
      });
    }

    if (reminder_times.length === 0) {
      return res.status(400).json({
        error: "At least one reminder time is required",
      });
    }

    // -----------------------------------------
    // Validate times
    // -----------------------------------------

    for (const time of reminder_times) {
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
        return res.status(400).json({
          error: `Invalid reminder time: ${time}`,
        });
      }
    }

    // -----------------------------------------
    // Prevent duplicate times
    // -----------------------------------------

    const uniqueTimes = new Set(reminder_times);

    if (uniqueTimes.size !== reminder_times.length) {
      return res.status(400).json({
        error: "Reminder times must be different",
      });
    }

    // -----------------------------------------
    // Get medicine belonging to this user
    // -----------------------------------------

    const [medicineRows] = await pool.query(
      `
      SELECT
        id,
        name,
        dosage,
        frequency,
        start_date,
        end_date
      FROM medicines
      WHERE id = ? AND user_id = ?
      `,
      [medicine_id, userId]
    );

    if (medicineRows.length === 0) {
      return res.status(404).json({
        error: "Medicine not found for this user",
      });
    }

    const medicine = medicineRows[0];

    // -----------------------------------------
    // Convert medicine frequency
    // -----------------------------------------

    const reminderFrequency = getReminderFrequency(
      medicine.frequency
    );

    if (!reminderFrequency) {
      return res.status(400).json({
        error: "Invalid medicine frequency",
      });
    }

    // -----------------------------------------
    // Check number of times against frequency
    // -----------------------------------------

    const expectedTimes = {
      "Once daily": 1,
      "Twice daily": 2,
      "Three times daily": 3,
      "Four times daily": 4,
      "Weekly": 1,
    };

    const expectedCount =
      expectedTimes[medicine.frequency];

    if (reminder_times.length !== expectedCount) {
      return res.status(400).json({
        error: `${medicine.frequency} requires ${expectedCount} reminder time${expectedCount > 1 ? "s" : ""}`,
      });
    }

    // -----------------------------------------
    // Medicine dates become reminder dates
    // -----------------------------------------

    const startDate = medicine.start_date;

    if (!startDate) {
      return res.status(400).json({
        error: "Medicine does not have a start date",
      });
    }

    const endDate =
      medicine.end_date || "2099-12-31";

    if (endDate < startDate) {
      return res.status(400).json({
        error: "Medicine end date cannot be before start date",
      });
    }

    // -----------------------------------------
    // Weekly reminder uses weekday of
    // medicine start date
    // -----------------------------------------

    const dayOfWeek =
      reminderFrequency === "weekly"
        ? getDayOfWeek(startDate)
        : null;

    // -----------------------------------------
    // Start transaction
    // -----------------------------------------

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const createdReminders = [];

      // -----------------------------------------
      // Create one reminder for each time
      // -----------------------------------------

      for (const reminderTime of reminder_times) {
        const [result] = await connection.query(
          `
          INSERT INTO reminders
          (
            user_id,
            medicine_id,
            reminder_time,
            start_date,
            end_date,
            frequency,
            day_of_week,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, "active")
          `,
          [
            userId,
            medicine_id,
            reminderTime,
            startDate,
            endDate,
            reminderFrequency,
            dayOfWeek,
          ]
        );

        createdReminders.push({
          id: result.insertId,
          user_id: userId,
          medicine_id,
          medicine_name: medicine.name,
          dosage: medicine.dosage,
          reminder_time: reminderTime,
          start_date: startDate,
          end_date: endDate,
          frequency: reminderFrequency,
          day_of_week: dayOfWeek,
          status: "active",
        });
      }

      await connection.commit();

      return res.status(201).json({
        message: "Reminder(s) created successfully",
        reminders: createdReminders,
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error("[reminder.create] error:", err);

    return res.status(500).json({
      error: "Something went wrong creating the reminder",
    });
  }
}


// =========================================================
// GET USER REMINDERS
// =========================================================

async function getMyReminders(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        r.*,
        m.name AS medicine_name,
        m.dosage AS dosage,
        m.frequency AS medicine_frequency
      FROM reminders r
      JOIN medicines m
        ON m.id = r.medicine_id
      WHERE r.user_id = ?
      ORDER BY r.reminder_time ASC
      `,
      [userId]
    );

    return res.json({
      reminders: rows,
    });

  } catch (err) {
    console.error("[reminder.getMy] error:", err);

    return res.status(500).json({
      error: "Something went wrong fetching reminders",
    });
  }
}


// =========================================================
// UPDATE REMINDER
// =========================================================

async function updateReminder(req, res) {
  try {
    const userId = req.user.id;
    const reminderId = req.params.id;

    const {
      reminder_time,
      status,
    } = req.body;

    // -----------------------------------------
    // Check reminder ownership
    // -----------------------------------------

    const [existing] = await pool.query(
      `
      SELECT id
      FROM reminders
      WHERE id = ? AND user_id = ?
      `,
      [reminderId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: "Reminder not found",
      });
    }

    // -----------------------------------------
    // Validate status
    // -----------------------------------------

    if (
      status !== undefined &&
      status !== "active" &&
      status !== "inactive"
    ) {
      return res.status(400).json({
        error: "Invalid reminder status",
      });
    }

    // -----------------------------------------
    // Validate time
    // -----------------------------------------

    if (
      reminder_time !== undefined &&
      !/^\d{2}:\d{2}(:\d{2})?$/.test(reminder_time)
    ) {
      return res.status(400).json({
        error: "Invalid reminder time",
      });
    }

    // -----------------------------------------
    // Update only time/status
    //
    // Start/end/frequency are controlled by the
    // medicine and should not be independently
    // changed from the reminder.
    // -----------------------------------------

    await pool.query(
      `
      UPDATE reminders
      SET
        reminder_time = COALESCE(?, reminder_time),
        status = COALESCE(?, status)
      WHERE id = ? AND user_id = ?
      `,
      [
        reminder_time || null,
        status || null,
        reminderId,
        userId,
      ]
    );

    return res.json({
      message: "Reminder updated",
    });

  } catch (err) {
    console.error("[reminder.update] error:", err);

    return res.status(500).json({
      error: "Something went wrong updating the reminder",
    });
  }
}


// =========================================================
// DELETE REMINDER
// =========================================================

async function deleteReminder(req, res) {
  try {
    const userId = req.user.id;
    const reminderId = req.params.id;

    const [result] = await pool.query(
      `
      DELETE FROM reminders
      WHERE id = ? AND user_id = ?
      `,
      [reminderId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Reminder not found",
      });
    }

    return res.json({
      message: "Reminder deleted",
    });

  } catch (err) {
    console.error("[reminder.delete] error:", err);

    return res.status(500).json({
      error: "Something went wrong deleting the reminder",
    });
  }
}


module.exports = {
  createReminder,
  getMyReminders,
  updateReminder,
  deleteReminder,
};