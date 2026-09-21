const { getCallGateway } = require('./callGateway/callGatewayFactory');
const pool = require('../config/db');

const RETRY_INTERVAL_MIN = Number(process.env.CALL_RETRY_INTERVAL_MINUTES) || 15;
const MAX_ATTEMPTS = Number(process.env.CALL_RETRY_MAX_ATTEMPTS) || 3;

const TERMINAL_STATUSES = ['completed', 'no_answer', 'busy', 'failed'];

const gateway = getCallGateway();

gateway.onStatus(async (event) => {
  console.log('[ReminderService] Call status event:', event);

  if (!TERMINAL_STATUSES.includes(event.status)) {
    return; // 'ringing' / 'connected' are just progress events, not a logged outcome
  }

  await pool.query(
    `INSERT INTO reminder_logs (reminder_id, attempt_number, status, attempted_at, error_message)
     VALUES (?, ?, ?, NOW(), ?)`,
    [
      event.reminderId,
      event.attemptNumber || 1,
      event.status,
      event.status === 'failed' ? 'Call failed to connect' : null,
    ]
  );

  if (event.status === 'no_answer' || event.status === 'busy') {
    scheduleRetry(event.reminderId, event.attemptNumber || 1, event.toNumber, event.audioFile);
  }
});

async function triggerReminderCall(reminder) {
  const { id: reminderId, phone_number } = reminder;

  return gateway.dial({
    toNumber: phone_number,
    audioFile: 'default_reminder.mp3',
    reminderId,
    attemptNumber: 1,
  });
}

function scheduleRetry(reminderId, previousAttempt, toNumber, audioFile) {
  const nextAttempt = previousAttempt + 1;

  if (nextAttempt > MAX_ATTEMPTS) {
    console.log(`[ReminderService] Reminder ${reminderId} missed after ${MAX_ATTEMPTS} attempts today.`);
    return;
  }

  setTimeout(async () => {
    // Check if it was somehow already acknowledged (e.g. via app) before retrying
    const [logs] = await pool.query(
      `SELECT status FROM reminder_logs WHERE reminder_id = ? AND DATE(attempted_at) = CURDATE()
       ORDER BY attempted_at DESC LIMIT 1`,
      [reminderId]
    );

    if (logs[0] && logs[0].status === 'completed') return;

    console.log(`[ReminderService] Retrying reminder ${reminderId} (attempt ${nextAttempt})`);

    await gateway.dial({
      toNumber,
      audioFile,
      reminderId,
      attemptNumber: nextAttempt,
    });
  }, RETRY_INTERVAL_MIN * 60 * 1000);
}

module.exports = { triggerReminderCall, scheduleRetry };