const folderService = require('../services/folderService');
const documentService = require('../services/documentService');

exports.list = async (req, res) => {
  const folders = await folderService.list(req.userId);
  res.json(folders);
};

exports.create = async (req, res) => {
  const { name, parentId } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama folder wajib diisi.' });
  const folder = await folderService.create(req.userId, name.trim(), parentId || null);
  res.status(201).json(folder);
};

exports.rename = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama folder wajib diisi.' });
  const folder = await folderService.rename(req.params.id, req.userId, name.trim());
  if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan.' });
  res.json(folder);
};

exports.delete = async (req, res) => {
  // Move docs in this folder to root
  await documentService.moveFolderDocsToRoot(req.params.id, req.userId);
  const folder = await folderService.delete(req.params.id, req.userId);
  if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan.' });
  res.json({ success: true });
};
