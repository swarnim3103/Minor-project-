const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOtp, getOtpExpiry, isOtpExpired } = require('../utils/otp.util');
const { sendEmail, otpEmailTemplate } = require('../utils/mailer.util');
const { sendSmsOtp } = require('../utils/sms.util');

function generateToken(users) {
  return jwt.sign(
    { id: users.id, role: users.role, email: users.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// =========================================================
// INTERNAL HELPERS (used by register + the resend endpoints)
// =========================================================

async function issueAndSendEmailOtp(userId, email) {
  const otp = generateOtp();
  const expiry = getOtpExpiry(10);

  await pool.query(
    'UPDATE users SET email_otp = ?, email_otp_expiry = ? WHERE id = ?',
    [otp, expiry, userId]
  );

  await sendEmail(email, 'Verify your email - MedCare', otpEmailTemplate(otp, 'verify your email'));
}

async function issueAndSendPhoneOtp(userId, phoneNumber) {
  const otp = generateOtp();
  const expiry = getOtpExpiry(10);

  await pool.query(
    'UPDATE users SET phone_otp = ?, phone_otp_expiry = ? WHERE id = ?',
    [otp, expiry, userId]
  );

  await sendSmsOtp(phoneNumber, otp);
}

// =========================================================
// EXISTING ENDPOINTS (unchanged, except one addition marked below)
// =========================================================

async function register(req, res) {
  try {
    const { name, email, password, role, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone_number) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role || 'patient', phone_number || null]
    );

    const users = { id: result.insertId, email, role: role || 'patient' };
    const token = generateToken(users);

    // ---- ADDED: fire off email + phone OTPs right after account creation ----
    try {
      await issueAndSendEmailOtp(users.id, email);
      if (phone_number) {
        await issueAndSendPhoneOtp(users.id, phone_number);
      }
    } catch (otpErr) {
      // Don't fail registration if OTP sending has an issue —
      // the user can hit "resend" from the verify-otp page.
      console.error('[auth.register] OTP send error:', otpErr);
    }
    // ---------------------------------------------------------------------

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      users: { id: users.id, name, email, role: users.role },
    });
  } catch (err) {
    console.error('[auth.register] error:', err);
    return res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows[0];

    if (!users) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, users.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(users);

    return res.json({
      message: 'Login successful',
      token,
      users: { id: users.id, name: users.name, email: users.email, role: users.role },
    });
  } catch (err) {
    console.error('[auth.login] error:', err);
    return res.status(500).json({ error: 'Something went wrong during login' });
  }
}

async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone_number, created_at FROM users WHERE id = ?',
      [req.users.id]
    );
    const users = rows[0];
    if (!users) {
      return res.status(404).json({ error: 'users not found' });
    }
    return res.json({ users });
  } catch (err) {
    console.error('[auth.getProfile] error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching profile' });
  }
}

// =========================================================
// NEW: EMAIL OTP VERIFICATION
// =========================================================

async function sendEmailOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    await issueAndSendEmailOtp(user.id, user.email);

    return res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('[auth.sendEmailOtp] error:', err);
    return res.status(500).json({ error: 'Failed to send email OTP' });
  }
}

async function verifyEmailOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });

    const [rows] = await pool.query(
      'SELECT id, email_otp, email_otp_expiry FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    if (!user.email_otp || user.email_otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    if (isOtpExpired(user.email_otp_expiry)) {
      return res.status(400).json({ error: 'OTP has expired, please request a new one' });
    }

    await pool.query(
      'UPDATE users SET is_email_verified = 1, email_otp = NULL, email_otp_expiry = NULL WHERE id = ?',
      [user.id]
    );

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[auth.verifyEmailOtp] error:', err);
    return res.status(500).json({ error: 'Failed to verify email OTP' });
  }
}

// =========================================================
// NEW: PHONE OTP VERIFICATION
// =========================================================

async function sendPhoneOtp(req, res) {
  try {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number is required' });

    const [rows] = await pool.query('SELECT id, phone_number FROM users WHERE phone_number = ?', [phone_number]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'No account found with this phone number' });

    await issueAndSendPhoneOtp(user.id, user.phone_number);

    return res.json({ message: 'OTP sent to phone' });
  } catch (err) {
    console.error('[auth.sendPhoneOtp] error:', err);
    return res.status(500).json({ error: 'Failed to send phone OTP' });
  }
}

async function verifyPhoneOtp(req, res) {
  try {
    const { phone_number, otp } = req.body;
    if (!phone_number || !otp) return res.status(400).json({ error: 'phone_number and otp are required' });

    const [rows] = await pool.query(
      'SELECT id, phone_otp, phone_otp_expiry FROM users WHERE phone_number = ?',
      [phone_number]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'No account found with this phone number' });

    if (!user.phone_otp || user.phone_otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    if (isOtpExpired(user.phone_otp_expiry)) {
      return res.status(400).json({ error: 'OTP has expired, please request a new one' });
    }

    await pool.query(
      'UPDATE users SET is_phone_verified = 1, phone_otp = NULL, phone_otp_expiry = NULL WHERE id = ?',
      [user.id]
    );

    return res.json({ message: 'Phone number verified successfully' });
  } catch (err) {
    console.error('[auth.verifyPhoneOtp] error:', err);
    return res.status(500).json({ error: 'Failed to verify phone OTP' });
  }
}

// =========================================================
// NEW: FORGOT PASSWORD (email OTP based)
// =========================================================

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // Always respond the same way whether or not the email exists,
    // so we don't leak which emails are registered.
    if (user) {
      const otp = generateOtp();
      const expiry = getOtpExpiry(10);

      await pool.query(
        'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?',
        [otp, expiry, user.id]
      );

      await sendEmail(
        user.email,
        'Reset your password - MedCare',
        otpEmailTemplate(otp, 'reset your password')
      );
    }

    return res.json({ message: 'If this email is registered, a reset code has been sent.' });
  } catch (err) {
    console.error('[auth.forgotPassword] error:', err);
    return res.status(500).json({ error: 'Failed to process forgot password request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'email, otp, and newPassword are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, reset_otp, reset_otp_expiry FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    if (isOtpExpired(user.reset_otp_expiry)) {
      return res.status(400).json({ error: 'OTP has expired, please request a new one' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[auth.resetPassword] error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  forgotPassword,
  resetPassword,
};