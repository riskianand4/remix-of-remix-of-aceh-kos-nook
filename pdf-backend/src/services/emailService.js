const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Project DocGen" <${config.FROM_EMAIL}>`,
    to: email,
    subject: 'Verifikasi Email Anda',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1a3d3d; margin-bottom: 8px;">Verifikasi Email Anda</h2>
        <p style="color: #374151; margin-bottom: 24px;">Halo <strong>${name || email}</strong>,<br/>Terima kasih telah mendaftar. Klik tombol di bawah untuk memverifikasi email Anda.</p>
        <a href="${verifyUrl}" style="display:inline-block; background:#2d6a6a; color:#ffffff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; margin-bottom:24px;">Verifikasi Email</a>
        <p style="color:#6b7280; font-size:13px;">Atau salin tautan ini ke browser Anda:<br/><a href="${verifyUrl}" style="color:#2d6a6a; word-break:break-all;">${verifyUrl}</a></p>
        <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Jika Anda tidak mendaftar, abaikan email ini.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Project DocGen" <${config.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset Password Anda',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1a3d3d; margin-bottom: 8px;">Reset Password</h2>
        <p style="color: #374151; margin-bottom: 24px;">Halo <strong>${name || email}</strong>,<br/>Klik tombol di bawah untuk mereset password Anda. Link berlaku selama 1 jam.</p>
        <a href="${resetUrl}" style="display:inline-block; background:#2d6a6a; color:#ffffff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; margin-bottom:24px;">Reset Password</a>
        <p style="color:#6b7280; font-size:13px;">Atau salin tautan ini:<br/><a href="${resetUrl}" style="color:#2d6a6a; word-break:break-all;">${resetUrl}</a></p>
        <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
