const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.APP_URL || 'https://planetpoints.app';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@planetpoints.app';

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"PlanetPoints" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your PlanetPoints password',
    text: `Hi there!\n\nYou requested a password reset for your PlanetPoints account.\n\nClick this link to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nHappy recycling!\nThe PlanetPoints Team`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #16a34a;">PlanetPoints</h2>
        <p>Hi there!</p>
        <p>You requested a password reset for your PlanetPoints account.</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white;
                    text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 0.875rem; color: #6b7280;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <p>Happy recycling!<br>The PlanetPoints Team</p>
      </div>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
