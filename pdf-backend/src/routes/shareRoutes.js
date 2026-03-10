const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ShareLink = require('../models/ShareLink');
const Comment = require('../models/Comment');
const Document = require('../models/Document');
const crypto = require('crypto');

const router = Router();

function generateCode(len = 8) {
  return crypto.randomBytes(len).toString('base64url').slice(0, len).toUpperCase();
}

// Create share link for a document
router.post('/documents/:id/share', asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const code = generateCode(10);
  const accessCode = req.body.accessCode || generateCode(6);
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

// List share links for a document
router.get('/documents/:id/shares', asyncHandler(async (req, res) => {
  const links = await ShareLink.find({ documentId: req.params.id }).sort({ createdAt: -1 });
  res.json(links);
}));

// Delete (deactivate) a share link
router.delete('/shares/:id', asyncHandler(async (req, res) => {
  await ShareLink.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ ok: true });
}));

// Verify access code and get document for review
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

// Get comments for a shared document
router.get('/review/:code/comments', asyncHandler(async (req, res) => {
  const link = await ShareLink.findOne({ code: req.params.code, active: true });
  if (!link) return res.status(404).json({ error: 'Link tidak valid' });

  const comments = await Comment.find({ shareCode: req.params.code }).sort({ createdAt: 1 });
  res.json(comments);
}));

// Add comment
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

// Resolve/unresolve comment
router.patch('/comments/:id/resolve', asyncHandler(async (req, res) => {
  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    { resolved: !req.body.resolved ? true : false },
    { new: true }
  );
  if (!comment) return res.status(404).json({ error: 'Komentar tidak ditemukan' });
  res.json(comment);
}));

// Delete comment
router.delete('/comments/:id', asyncHandler(async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

module.exports = router;
