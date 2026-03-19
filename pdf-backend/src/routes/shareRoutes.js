const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const ShareLink = require('../models/ShareLink');
const Comment = require('../models/Comment');
const Document = require('../models/Document');
const crypto = require('crypto');

const router = Router();

// 43-char URL-safe encrypted code — hard to guess
function generateLongCode() {
  return crypto.randomBytes(32).toString('base64url');
}

// 6-char short access PIN
function generatePin() {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();
}


router.post('/review/:code/access', asyncHandler(async (req, res) => {
  const link = await ShareLink.findOne({ code: req.params.code, active: true });
  if (!link) return res.status(404).json({ error: 'Link tidak ditemukan atau sudah tidak aktif' });

  if (link.expiresAt && new Date() > link.expiresAt) {
    return res.status(410).json({ error: 'Link sudah kedaluwarsa' });
  }

  if (req.body.accessCode !== link.accessCode) {
    return res.status(403).json({ error: 'Kode akses salah' });
  }

  const doc = await Document.findById(link.documentId);
  if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

  res.json({ document: doc, shareCode: link.code });
}));

// Get comments for a shared document — public
router.get('/review/:code/comments', asyncHandler(async (req, res) => {
  const link = await ShareLink.findOne({ code: req.params.code, active: true });
  if (!link) return res.status(404).json({ error: 'Link tidak valid' });

  const comments = await Comment.find({ shareCode: req.params.code }).sort({ createdAt: 1 });
  res.json(comments);
}));

// Add comment — public
router.post('/review/:code/comments', asyncHandler(async (req, res) => {
  const link = await ShareLink.findOne({ code: req.params.code, active: true });
  if (!link) return res.status(404).json({ error: 'Link tidak valid' });

  const comment = await Comment.create({
    documentId: link.documentId,
    shareCode: req.params.code,
    author: req.body.author || 'Anonim',
    text: req.body.text,
    parentId: req.body.parentId || null,
  });

  res.status(201).json(comment);
}));

// Resolve/unresolve comment — public (reviewer can resolve)
router.patch('/comments/:id/resolve', asyncHandler(async (req, res) => {
  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { resolved: !req.body.resolved ? true : false },
    { new: true }
  );
  if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });
  res.json(comment);
}));

// Delete comment — public
router.delete('/comments/:id', asyncHandler(async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
// Create share link — requires auth (document owner only)
router.post('/documents/:id/share', authMiddleware, asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const code = generateLongCode();
  const accessCode = req.body.accessCode || generatePin();
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;

  const link = await ShareLink.create({
    documentId: doc._id,
    code,
    accessCode,
    createdBy: req.body.createdBy || '',
    expiresAt,
  });

  res.status(201).json(link);
}));

// List share links — requires auth
router.get('/documents/:id/shares', authMiddleware, asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const links = await ShareLink.find({ documentId: req.params.id }).sort({ createdAt: -1 });
  res.json(links);
}));

// Delete share link — requires auth
router.delete('/shares/:id', authMiddleware, asyncHandler(async (req, res) => {
  await ShareLink.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ ok: true });
}));


module.exports = router;
