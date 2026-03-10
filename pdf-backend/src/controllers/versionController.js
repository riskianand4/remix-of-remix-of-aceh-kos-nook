const versionService = require('../services/versionService');

exports.list = async (req, res) => {
  const versions = await versionService.list(req.params.id);
  res.json(versions);
};

exports.save = async (req, res) => {
  const version = await versionService.save(req.params.id, req.body);
  res.status(201).json(version);
};

exports.restore = async (req, res) => {
  const snapshot = await versionService.restore(req.params.id, req.params.vid);
  if (!snapshot) return res.status(404).json({ error: 'Version not found' });
  res.json(snapshot);
};
