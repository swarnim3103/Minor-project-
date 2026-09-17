// STUB implementation — no real SMS provider is wired up yet.
// It just logs the OTP to the server console so you can test the
// full phone-OTP flow end to end without paying for or registering
// with an SMS gateway.
//
// TO GO LIVE LATER: replace only the body of sendSmsOtp() below with
// a real API call (e.g. Twilio, MSG91, Fast2SMS). Nothing else in the
// app needs to change — every controller calls this same function.
//
// Example (Fast2SMS, once you have an API key + DLT-approved template):
//
// const axios = require('axios');
// async function sendSmsOtp(phoneNumber, otp) {
//   await axios.post('https://www.fast2sms.com/dev/bulkV2', {
//     route: 'otp',
//     variables_values: otp,
//     numbers: phoneNumber,
//   }, {
//     headers: { authorization: process.env.FAST2SMS_API_KEY },
//   });
// }

async function sendSmsOtp(phoneNumber, otp) {
  console.log(`[SMS STUB] OTP for ${phoneNumber}: ${otp}`);
  return true;
}

module.exports = { sendSmsOtp };