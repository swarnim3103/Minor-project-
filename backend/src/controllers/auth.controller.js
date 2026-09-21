const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const otpService = require('../services/otpService');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

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

    const user = { id: result.insertId, email, role: role || 'patient' };
    const token = generateToken(user);

    try {
      await otpService.sendEmailOtp(email);
      if (phone_number) {
        await otpService.sendPhoneOtp(phone_number);
      }
    } catch (otpErr) {
      console.error('[auth.register] OTP send error:', otpErr.message);
    }

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      users: { id: user.id, name, email, role: user.role },
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
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      users: { id: user.id, name: user.name, email: user.email, role: user.role },
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
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ users: user });
  } catch (err) {
    console.error('[auth.getProfile] error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching profile' });
  }
}

async function sendEmailOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    await otpService.sendEmailOtp(email);
    return res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function verifyEmailOtpHandler(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });

    await otpService.verifyEmailOtp(email, otp);
    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function sendPhoneOtpHandler(req, res) {
  try {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number is required' });

    await otpService.sendPhoneOtp(phone_number);
    return res.json({ message: 'OTP sent to your phone' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function verifyPhoneOtpHandler(req, res) {
  try {
    const { phone_number, otp } = req.body;
    if (!phone_number || !otp) return res.status(400).json({ error: 'phone_number and otp are required' });

    await otpService.verifyPhoneOtp(phone_number, otp);
    return res.json({ message: 'Phone verified successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function forgotPasswordHandler(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    await otpService.sendResetOtp(email);
    return res.json({ message: 'Password reset code sent to your email' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function resetPasswordHandler(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'email, otp, and newPassword are required' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await otpService.verifyResetOtpAndSetPassword(email, otp, newPasswordHash);
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  sendEmailOtp,
  verifyEmailOtp: verifyEmailOtpHandler,
  sendPhoneOtp: sendPhoneOtpHandler,
  verifyPhoneOtp: verifyPhoneOtpHandler,
  forgotPassword: forgotPasswordHandler,
  resetPassword: resetPasswordHandler,
};