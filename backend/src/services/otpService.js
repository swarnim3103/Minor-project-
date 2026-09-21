const axios = require('axios');
const pool = require('../config/db');

const OTP_EXPIRY_MINUTES = 5;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

// --- EMAIL OTP (mocked delivery via console log for now - swap in real email later) ---

async function sendEmailOtp(email) {
  const otp = generateOtp();
  const expiry = getExpiryDate();

  const [result] = await pool.query(
    'UPDATE users SET email_otp = ?, email_otp_expiry = ? WHERE email = ?',
    [otp, expiry, email]
  );

  if (result.affectedRows === 0) {
    throw new Error('No account found with this email');
  }

  // TODO: replace with real email sending (Nodemailer) when ready.
  console.log(`[EMAIL OTP] To: ${email} | Code: ${otp} (expires in ${OTP_EXPIRY_MINUTES} min)`);

  return { otp }; // returned for dev visibility only; don't expose this in the API response
}

async function verifyEmailOtp(email, submittedOtp) {
  const [rows] = await pool.query(
    'SELECT email_otp, email_otp_expiry FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  if (!user || !user.email_otp) {
    throw new Error('No OTP found. Please request a new one.');
  }
  if (new Date() > new Date(user.email_otp_expiry)) {
    throw new Error('OTP expired. Please request a new one.');
  }
  if (user.email_otp !== submittedOtp) {
    throw new Error('Incorrect OTP.');
  }

  await pool.query(
    'UPDATE users SET is_email_verified = 1, email_otp = NULL, email_otp_expiry = NULL WHERE email = ?',
    [email]
  );
}

// --- PHONE OTP (real delivery via Termux SMS gateway) ---

async function sendPhoneOtp(phoneNumber) {
  const otp = generateOtp();
  const expiry = getExpiryDate();

  const [result] = await pool.query(
    'UPDATE users SET phone_otp = ?, phone_otp_expiry = ? WHERE phone_number = ?',
    [otp, expiry, phoneNumber]
  );

  if (result.affectedRows === 0) {
    throw new Error('No account found with this phone number');
  }

  try {
    await axios.post(`${process.env.PHONE_GATEWAY_URL}/send-sms`, {
      number: phoneNumber,
      message: `Your MedCare verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
    console.log(`[PHONE OTP] Sent to ${phoneNumber}`);
  } catch (err) {
    console.error('[PHONE OTP] Failed to send via phone gateway:', err.message);
    throw new Error('Could not send OTP SMS - is the phone gateway running?');
  }
}

async function verifyPhoneOtp(phoneNumber, submittedOtp) {
  const [rows] = await pool.query(
    'SELECT phone_otp, phone_otp_expiry FROM users WHERE phone_number = ?',
    [phoneNumber]
  );
  const user = rows[0];

  if (!user || !user.phone_otp) {
    throw new Error('No OTP found. Please request a new one.');
  }
  if (new Date() > new Date(user.phone_otp_expiry)) {
    throw new Error('OTP expired. Please request a new one.');
  }
  if (user.phone_otp !== submittedOtp) {
    throw new Error('Incorrect OTP.');
  }

  await pool.query(
    'UPDATE users SET is_phone_verified = 1, phone_otp = NULL, phone_otp_expiry = NULL WHERE phone_number = ?',
    [phoneNumber]
  );
}

// --- FORGOT PASSWORD (email OTP based) ---

async function sendResetOtp(email) {
  const otp = generateOtp();
  const expiry = getExpiryDate();

  const [result] = await pool.query(
    'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
    [otp, expiry, email]
  );

  if (result.affectedRows === 0) {
    throw new Error('No account found with this email');
  }

  console.log(`[RESET OTP] To: ${email} | Code: ${otp} (expires in ${OTP_EXPIRY_MINUTES} min)`);
}

async function verifyResetOtpAndSetPassword(email, submittedOtp, newPasswordHash) {
  const [rows] = await pool.query(
    'SELECT reset_otp, reset_otp_expiry FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  if (!user || !user.reset_otp) {
    throw new Error('No reset request found. Please request a new one.');
  }
  if (new Date() > new Date(user.reset_otp_expiry)) {
    throw new Error('Code expired. Please request a new one.');
  }
  if (user.reset_otp !== submittedOtp) {
    throw new Error('Incorrect code.');
  }

  await pool.query(
    'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?',
    [newPasswordHash, email]
  );
}

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendResetOtp,
  verifyResetOtpAndSetPassword,
};