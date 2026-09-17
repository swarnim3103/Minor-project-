// Generates a 6-digit numeric OTP and its expiry timestamp.

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // always 6 digits
}

function getOtpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function isOtpExpired(expiryDate) {
  if (!expiryDate) return true;
  return new Date(expiryDate).getTime() < Date.now();
}

module.exports = { generateOtp, getOtpExpiry, isOtpExpired };