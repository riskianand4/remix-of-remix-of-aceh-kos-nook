const User = require('../models/User');
const Document = require('../models/Document');

exports.listUsers = async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  // Get doc counts per user
  const userIds = users.map(u => u._id.toString());
  const docCounts = await Document.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  docCounts.forEach(d => { countMap[d._id] = d.count; });

  const result = users.map(u => {
    const j = u.toJSON();
    j.documentCount = countMap[u._id.toString()] || 0;
    return j;
  });

  res.json({ users: result, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.listAllDocuments = async (req, res) => {
  const { page = 1, limit = 50, search, userId } = req.query;
  const query = {};
  if (userId) query.userId = userId;
  if (search) query.$text = { $search: search };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [docs, total] = await Promise.all([
    Document.find(query).sort('-updatedAt').skip(skip).limit(parseInt(limit)),
    Document.countDocuments(query),
  ]);
  res.json({ docs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.userId) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  await Document.deleteMany({ userId: id });
  await User.findByIdAndDelete(id);
  res.json({ success: true });
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role tidak valid.' });
  if (id === req.userId) return res.status(400).json({ error: 'Tidak bisa mengubah role sendiri.' });
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  res.json(user.toJSON());
};
