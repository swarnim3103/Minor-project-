// Sends emails via Gmail using an App Password.
//
// SETUP (one-time):
// 1. Turn on 2-Step Verification on the Gmail account you want to send from:
//    https://myaccount.google.com/security
// 2. Create an App Password: https://myaccount.google.com/apppasswords
//    (choose "Mail" as the app) — Google gives you a 16-character password.
// 3. Add to your .env:
//      EMAIL_USER=youraddress@gmail.com
//      EMAIL_PASS=your16characterapppassword   (NOT your normal Gmail password)
//      EMAIL_FROM=MedCare <youraddress@gmail.com>   (optional, defaults to EMAIL_USER)

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

function otpEmailTemplate(otp, purpose = 'verify your email') {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0c8de9;">MedCare</h2>
      <p>Use the code below to ${purpose}. This code expires in 10 minutes.</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background:#f8fafc; padding: 16px; text-align:center; border-radius:8px;">
        ${otp}
      </div>
      <p style="color:#64748b; font-size: 12px; margin-top: 20px;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

module.exports = { sendEmail, otpEmailTemplate };