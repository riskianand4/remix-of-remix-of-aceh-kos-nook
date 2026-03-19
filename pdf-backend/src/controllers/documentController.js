const documentService = require('../services/documentService');
const versionService = require('../services/versionService');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.list = async (req, res) => {
  const { search, status, sort, page, limit } = req.query;
  const result = await documentService.list({
    userId: req.userId,
    search, status, sort,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 100,
  });
  res.json(result);
};

exports.listAll = async (req, res) => {
  const { search, status, sort, folderId } = req.query;
  const docs = await documentService.listAll({
    userId: req.userId,
    search, status, sort,
    folderId: folderId !== undefined ? folderId : undefined,
  });
  res.json(docs);
};

exports.getStats = async (req, res) => {
  const stats = await documentService.getStats(req.userId);
  res.json(stats);
};

exports.getById = async (req, res) => {
  const doc = await documentService.getById(req.params.id, req.userId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.create = async (req, res) => {
  const doc = await documentService.create({ ...req.body, userId: req.userId });
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await documentService.update(req.params.id, req.userId, req.body);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.delete = async (req, res) => {
  // Soft delete from dashboard
  const doc = await documentService.softDelete(req.params.id, req.userId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true });
};

exports.duplicate = async (req, res) => {
  const doc = await documentService.duplicate(req.params.id, req.userId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.status(201).json(doc);
};

exports.bulkDelete = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  const count = await documentService.bulkDelete(ids, req.userId);
  res.json({ deleted: count });
};

exports.moveToFolder = async (req, res) => {
  const { folderId } = req.body;
  const doc = await documentService.moveToFolder(req.params.id, req.userId, folderId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.archiveDelete = async (req, res) => {
  const { ids, password } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  if (!password) return res.status(400).json({ error: 'Password wajib diisi.' });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  if (!user.passwordHash) return res.status(400).json({ error: 'Akun Google tidak memiliki password.' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Password salah.' });

  const count = await documentService.permanentDelete(ids, req.userId);
  res.json({ deleted: count });
};

exports.exportDocs = async (req, res) => {
  const { ids } = req.body;
  const docs = await documentService.exportDocs(ids, req.userId);
  res.json(docs);
};

exports.importDocs = async (req, res) => {
  const docs = Array.isArray(req.body) ? req.body : req.body.docs;
  if (!docs || !Array.isArray(docs)) return res.status(400).json({ error: 'docs array required' });
  const count = await documentService.importDocs(docs, req.userId);
  res.json({ imported: count });
};

exports.verifyByCode = async (req, res) => {
  const doc = await documentService.findByCode(req.params.code);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.listPublished = async (req, res) => {
  const docs = await documentService.listPublished();
  res.json(docs);
};

exports.forkPublished = async (req, res) => {
  const forked = await documentService.forkDocument(req.params.id, req.userId);
  if (!forked) return res.status(404).json({ error: 'Dokumen tidak ditemukan atau belum dipublikasikan.' });
  res.status(201).json(forked);
};

exports.publish = async (req, res) => {
  const { isPublished } = req.body;
  const doc = await documentService.togglePublish(req.params.id, req.userId, !!isPublished);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};
