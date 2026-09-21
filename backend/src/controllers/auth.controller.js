const bcrypt = require('bcryptjs');
const otpService = require('../services/otpService');

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
  // ...keep your existing register, login, getProfile exports here...
  sendEmailOtp,
  verifyEmailOtp: verifyEmailOtpHandler,
  sendPhoneOtp: sendPhoneOtpHandler,
  verifyPhoneOtp: verifyPhoneOtpHandler,
  forgotPassword: forgotPasswordHandler,
  resetPassword: resetPasswordHandler,
};