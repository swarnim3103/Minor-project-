const pool = require('../config/db');
const { createAndSendOtp, verifyOtp } = require('../services/otpService');

async function sendOtp(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query('SELECT phone_number FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user || !user.phone_number) {
      return res.status(400).json({ error: 'No phone number on file for this user' });
    }

    const { expiresAt } = await createAndSendOtp(userId, user.phone_number);
    return res.json({ message: 'OTP sent successfully', expiresAt });
  } catch (err) {
    console.error('[otp.send] error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
}

async function checkOtp(req, res) {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const result = await verifyOtp(userId, otp);

    if (!result.success) {
      return res.status(400).json({ error: result.reason });
    }

    return res.json({ message: 'Phone number verified successfully' });
  } catch (err) {
    console.error('[otp.verify] error:', err.message);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}

module.exports = { sendOtp, checkOtp };