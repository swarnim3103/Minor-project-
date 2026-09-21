const cron = require("node-cron");
const pool = require("../config/db");
const { triggerReminderCall } = require("../services/reminderService");

// Get current date and time in India (IST)
function getIndiaDateTime() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
    minute: `${values.hour}:${values.minute}`,
  };
}


function startReminderScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      // Current time/date in India
      const indiaTime = getIndiaDateTime();

      console.log(
        `[Scheduler] India time: ${indiaTime.date} ${indiaTime.time}`
      );

      /*
        MySQL DAYOFWEEK():

        1 = Sunday
        2 = Monday
        3 = Tuesday
        4 = Wednesday
        5 = Thursday
        6 = Friday
        7 = Saturday
      */

      const [dueReminders] = await pool.query(
        `
        SELECT
          r.id,
          r.user_id,
          r.medicine_id,
          r.reminder_time,
          r.frequency,
          r.day_of_week,
          u.phone_number

        FROM reminders r

        JOIN users u
          ON u.id = r.user_id

        WHERE r.status = 'active'

          -- Reminder must be active on today's Indian date
          AND ? BETWEEN r.start_date AND r.end_date

          -- Reminder time must match current Indian time
          AND TIME_FORMAT(r.reminder_time, '%H:%i') = ?

          -- Daily reminders run every day
          -- Weekly reminders run only on their selected day
          AND (
            r.frequency = 'daily'

            OR (
              r.frequency = 'weekly'
              AND r.day_of_week = DAYOFWEEK(?)
            )
          )
        `,
        [
          indiaTime.date,
          indiaTime.minute,
          indiaTime.date,
        ]
      );


      for (const reminder of dueReminders) {

        /*
          Prevent duplicate calls.

          attempted_at is stored by MySQL in UTC,
          so convert it to IST before checking today's date.
        */

        const [alreadyCalledToday] = await pool.query(
          `
          SELECT id
          FROM reminder_logs
          WHERE reminder_id = ?

            AND DATE(
              CONVERT_TZ(
                attempted_at,
                '+00:00',
                '+05:30'
              )
            ) = ?
          `,
          [
            reminder.id,
            indiaTime.date,
          ]
        );


        if (alreadyCalledToday.length > 0) {
          console.log(
            `[Scheduler] Reminder ${reminder.id} already handled today.`
          );

          continue;
        }


        console.log(
          `[Scheduler] Triggering reminder ${reminder.id} | ` +
          `frequency=${reminder.frequency} | ` +
          `day=${reminder.day_of_week ?? "N/A"} | ` +
          `time=${reminder.reminder_time}`
        );


        await triggerReminderCall(reminder);
      }

    } catch (error) {
      console.error("[Scheduler] Error:", error);
    }
  });


  console.log(
    "[Scheduler] Reminder scheduler started " +
    "(checks every minute, timezone: Asia/Kolkata)."
  );
}


module.exports = {
  startReminderScheduler,
};