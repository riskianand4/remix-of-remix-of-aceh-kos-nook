const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

function signToken(user) {
  return jwt.sign({ userId: user._id || user.id, email: user.email }, config.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email sudah terdaftar.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomUUID();
  const user = await User.create({ email: email.toLowerCase(), passwordHash, name: name || '', verificationToken, verified: false });

  sendVerificationEmail(user.email, user.name, verificationToken).catch(err =>
    console.error('Failed to send verification email:', err.message)
  );

  res.status(201).json({ message: 'Pendaftaran berhasil. Silakan cek email Anda untuk verifikasi.' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi.' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Email atau password salah.' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Email atau password salah.' });

  if (!user.verified) return res.status(403).json({ error: 'Email belum diverifikasi. Silakan cek inbox Anda.', code: 'EMAIL_NOT_VERIFIED' });

  const token = signToken(user);
  res.json({ token, user: user.toJSON() });
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token tidak ditemukan.' });

  const user = await User.findOne({ verificationToken: token });
  if (!user) return res.status(400).json({ error: 'Token tidak valid atau sudah digunakan.' });
  if (user.verified) return res.json({ message: 'Email sudah terverifikasi sebelumnya.' });

  user.verified = true;
  user.verificationToken = null;
  await user.save();

  res.json({ message: 'Email berhasil diverifikasi. Anda sekarang dapat login.' });
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential wajib diisi.' });

  if (!config.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_ID === 'your-google-client-id') {
    return res.status(501).json({ error: 'Google OAuth belum dikonfigurasi. Tambahkan GOOGLE_CLIENT_ID ke .env' });
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: config.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] });
    if (!user) {
      user = await User.create({
        email: payload.email.toLowerCase(),
        name: payload.name || '',
        avatarUrl: payload.picture || '',
        googleId: payload.sub,
        verified: true,
        verificationToken: null,
      });
    } else {
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.verified) user.verified = true;
      if (!user.name) user.name = payload.name || '';
      if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.status(401).json({ error: 'Verifikasi Google gagal.' });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  res.json(user.toJSON());
};

exports.updateProfile = async (req, res) => {
  const { name, avatarUrl } = req.body;
  const update = {};
  if (name !== undefined) update.name = String(name).trim();
  if (avatarUrl !== undefined) update.avatarUrl = String(avatarUrl);

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  res.json(user.toJSON());
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword dan newPassword wajib diisi.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

  if (!user.passwordHash) return res.status(400).json({ error: 'Akun ini tidak memiliki password (login via Google).' });

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Password saat ini salah.' });

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ message: 'Password berhasil diubah.' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email wajib diisi.' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });

  const resetToken = crypto.randomUUID();
  user.resetToken = resetToken;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  sendPasswordResetEmail(user.email, user.name, resetToken).catch(err =>
    console.error('Failed to send reset email:', err.message)
  );

  res.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token dan password wajib diisi.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });

  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ message: 'Password berhasil direset. Silakan login.' });
};

exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password wajib diisi.' });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  if (!user.passwordHash) return res.status(400).json({ error: 'Akun ini tidak memiliki password (login via Google).' });

  const match = await bcrypt.compare(password, user.passwordHash);
  res.json({ valid: match });
};
