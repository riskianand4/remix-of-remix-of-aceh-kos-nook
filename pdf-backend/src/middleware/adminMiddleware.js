const User = require('../models/User');

module.exports = async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Gagal memverifikasi role.' });
  }
};
