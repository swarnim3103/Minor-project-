const axios = require('axios');
const pool = require('../config/db');
const { generateOtp, getOtpExpiry, isOtpExpired } = require('../utils/otp.util');
const { sendSmsOtp } = require('../utils/sms.util');
const { sendEmail, otpEmailTemplate } = require('../utils/mailer.util');

const OTP_EXPIRY_MINUTES = 5;

// --- EMAIL OTP (now actually sent via mailer.util, not just logged) ---

async function sendEmailOtp(email) {
  const otp = generateOtp();
  const expiry = getOtpExpiry(OTP_EXPIRY_MINUTES);

  const [result] = await pool.query(
    'UPDATE users SET email_otp = ?, email_otp_expiry = ? WHERE email = ?',
    [otp, expiry, email]
  );

  if (result.affectedRows === 0) {
    throw new Error('No account found with this email');
  }

  await sendEmail(email, 'Your MedCare verification code', otpEmailTemplate(otp, 'verify your email'));

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
  if (isOtpExpired(user.email_otp_expiry)) {
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

// --- PHONE OTP (real delivery via Termux phone/SMS gateway) ---
// Used by auth.controller's sendPhoneOtp / verifyPhoneOtp routes.

async function sendPhoneOtp(phoneNumber) {
  const otp = generateOtp();
  const expiry = getOtpExpiry(OTP_EXPIRY_MINUTES);

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
  if (isOtpExpired(user.phone_otp_expiry)) {
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

// --- GENERIC AUTHENTICATED-USER PHONE OTP (used by otp.controller.js) ---
// Same phone_otp columns as above, but keyed by userId (from the JWT) instead
// of a phone_number passed in the body, and delivered via the sms.util stub
// so it works even before a real SMS provider or the phone gateway is set up.

async function createAndSendOtp(userId, phoneNumber) {
  const otp = generateOtp();
  const expiresAt = getOtpExpiry(OTP_EXPIRY_MINUTES);

  const [result] = await pool.query(
    'UPDATE users SET phone_otp = ?, phone_otp_expiry = ? WHERE id = ?',
    [otp, expiresAt, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User not found');
  }

  await sendSmsOtp(phoneNumber, otp);

  return { expiresAt };
}

async function verifyOtp(userId, submittedOtp) {
  const [rows] = await pool.query(
    'SELECT phone_otp, phone_otp_expiry FROM users WHERE id = ?',
    [userId]
  );
  const user = rows[0];

  if (!user || !user.phone_otp) {
    return { success: false, reason: 'No OTP found. Please request a new one.' };
  }
  if (isOtpExpired(user.phone_otp_expiry)) {
    return { success: false, reason: 'OTP expired. Please request a new one.' };
  }
  if (user.phone_otp !== submittedOtp) {
    return { success: false, reason: 'Incorrect OTP.' };
  }

  await pool.query(
    'UPDATE users SET is_phone_verified = 1, phone_otp = NULL, phone_otp_expiry = NULL WHERE id = ?',
    [userId]
  );

  return { success: true };
}

// --- FORGOT PASSWORD (email OTP based) ---

async function sendResetOtp(email) {
  const otp = generateOtp();
  const expiry = getOtpExpiry(OTP_EXPIRY_MINUTES);

  const [result] = await pool.query(
    'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
    [otp, expiry, email]
  );

  if (result.affectedRows === 0) {
    throw new Error('No account found with this email');
  }

  await sendEmail(email, 'Your MedCare password reset code', otpEmailTemplate(otp, 'reset your password'));
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
  if (isOtpExpired(user.reset_otp_expiry)) {
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
  createAndSendOtp,
  verifyOtp,
  sendResetOtp,
  verifyResetOtpAndSetPassword,
};