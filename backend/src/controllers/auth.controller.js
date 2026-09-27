const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const otpService = require('../services/otpService');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

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
      user: { id: user.id, name, email, role: user.role },
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[auth.login] error:', err);
    return res.status(500).json({ error: 'Something went wrong during login' });
  }
}

async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
  `SELECT
    id,
    name,
    email,
    role,
    phone_number,
    created_at,
    profile_picture_url,
    profile_picture_public_id
   FROM users
   WHERE id = ?`,
  [req.user.id]
);

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({ user });
  } catch (err) {
    console.error("[auth.getProfile] error:", err);

    return res.status(500).json({
      error: "Something went wrong fetching profile",
    });
  }
}

async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please select an image to upload.',
      });
    }

    const [rows] = await pool.query(
      `SELECT profile_picture_public_id
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Upload the image buffer to Cloudinary.
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'medcare/profiles',
          resource_type: 'image',
          transformation: [
            {
              width: 500,
              height: 500,
              crop: 'limit',
            },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(stream);
    });

    // Save the new image details in the database.
    await pool.query(
      `UPDATE users
       SET profile_picture_url = ?,
           profile_picture_public_id = ?
       WHERE id = ?`,
      [result.secure_url, result.public_id, req.user.id]
    );

    // Delete the previous Cloudinary image, if there was one.
    const oldPublicId = rows[0].profile_picture_public_id;

    if (oldPublicId && oldPublicId !== result.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cleanupError) {
        console.error(
          'Could not delete previous profile picture:',
          cleanupError.message
        );
      }
    }

    return res.json({
      message: 'Profile picture updated successfully.',
      profile_picture_url: result.secure_url,
    });
  } catch (err) {
    console.error('[auth.uploadProfilePicture]', err);

    return res.status(500).json({
      error: 'Could not upload profile picture.',
    });
  }
}

async function removeProfilePicture(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT profile_picture_public_id
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const publicId = rows[0].profile_picture_public_id;

    // Clear the database first so the profile no longer uses the image.
    await pool.query(
      `UPDATE users
       SET profile_picture_url = NULL,
           profile_picture_public_id = NULL
       WHERE id = ?`,
      [req.user.id]
    );

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {
        console.error(
          'Could not delete Cloudinary image:',
          cleanupError.message
        );
      }
    }

    return res.json({
      message: 'Profile picture removed successfully.',
    });
  } catch (err) {
    console.error('[auth.removeProfilePicture]', err);

    return res.status(500).json({
      error: 'Could not remove profile picture.',
    });
  }
}

async function deleteAccount(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Enter your current password to delete your account.',
      });
    }

    const [rows] = await pool.query(
      `SELECT id, password_hash, profile_picture_public_id
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Your current password is incorrect.',
      });
    }

    // Related records are configured with ON DELETE CASCADE.
    await pool.query(
      'DELETE FROM users WHERE id = ?',
      [req.user.id]
    );

    // The account is already deleted if this cleanup fails.
    if (user.profile_picture_public_id) {
      try {
        await cloudinary.uploader.destroy(
          user.profile_picture_public_id
        );
      } catch (cleanupError) {
        console.error(
          'Could not delete account profile picture:',
          cleanupError.message
        );
      }
    }

    return res.json({
      message: 'Your account has been deleted.',
    });
  } catch (err) {
    console.error('[auth.deleteAccount]', err);

    return res.status(500).json({
      error: 'Could not delete your account.',
    });
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
  resetPassword: resetPasswordHandler, uploadProfilePicture,
removeProfilePicture,
deleteAccount,
};