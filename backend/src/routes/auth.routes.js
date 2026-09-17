const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getProfile);

// ---- NEW: email OTP verification ----
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);

// ---- NEW: phone OTP verification ----
router.post('/send-phone-otp', authController.sendPhoneOtp);
router.post('/verify-phone-otp', authController.verifyPhoneOtp);

// ---- NEW: forgot password (email OTP based) ----
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;