const documentService = require('../services/documentService');
const versionService = require('../services/versionService');

exports.list = async (req, res) => {
  const { search, status, sort, page, limit } = req.query;
  const result = await documentService.list({
    search, status, sort,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
  });
  res.json(result);
};

exports.getStats = async (req, res) => {
  const stats = await documentService.getStats();
  res.json(stats);
};

exports.getById = async (req, res) => {
  const doc = await documentService.getById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.create = async (req, res) => {
  const doc = await documentService.create(req.body);
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await documentService.update(req.params.id, req.body);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

exports.delete = async (req, res) => {
  const doc = await documentService.delete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  // Delete associated versions
  await versionService.deleteAll(req.params.id);
  res.json({ success: true });
};

exports.duplicate = async (req, res) => {
  const doc = await documentService.duplicate(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.status(201).json(doc);
};

exports.bulkDelete = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  const count = await documentService.bulkDelete(ids);
  // Delete associated versions
  await Promise.all(ids.map(id => versionService.deleteAll(id)));
  res.json({ deleted: count });
};

exports.exportDocs = async (req, res) => {
  const { ids } = req.body;
  let docs;
  if (ids && ids.length > 0) {
    const Document = require('../models/Document');
    docs = await Document.find({ _id: { $in: ids } });
  } else {
    const Document = require('../models/Document');
    docs = await Document.find();
  }
  res.json(docs);
};

exports.importDocs = async (req, res) => {
  const docs = Array.isArray(req.body) ? req.body : req.body.docs;
  if (!docs || !Array.isArray(docs)) return res.status(400).json({ error: 'docs array required' });
  const count = await documentService.importDocs(docs);
  res.json({ imported: count });
};

exports.verifyByCode = async (req, res) => {
  const doc = await documentService.findByCode(req.params.code);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};
