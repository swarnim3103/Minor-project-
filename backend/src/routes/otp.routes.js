const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const { authenticate } = require('../middleware/auth');

router.post('/send', authenticate, otpController.sendOtp);
router.post('/verify', authenticate, otpController.checkOtp);

module.exports = router;