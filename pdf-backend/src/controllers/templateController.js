const templateService = require('../services/templateService');
const documentService = require('../services/documentService');

exports.list = async (req, res) => {
  const templates = await templateService.list(req.userId);
  res.json(templates);
};

exports.create = async (req, res) => {
  const { name, description, icon, snapshot } = req.body;
  if (!name || !snapshot) return res.status(400).json({ error: 'name and snapshot required' });
  const template = await templateService.create({ name, description, icon, category: 'custom', snapshot, userId: req.userId });
  res.status(201).json(template);
};

exports.delete = async (req, res) => {
  const tmpl = await templateService.delete(req.params.id, req.userId);
  if (!tmpl) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
};

exports.createDocFromTemplate = async (req, res) => {
  const tmpl = await templateService.getById(req.params.id, req.userId);
  if (!tmpl) return res.status(404).json({ error: 'Template not found' });
  const docData = {
    ...JSON.parse(JSON.stringify(tmpl.snapshot)),
    title: tmpl.name,
    status: 'draft',
    userId: req.userId,
  };
  delete docData.id;
  delete docData._id;
  const doc = await documentService.create(docData);
  res.status(201).json(doc);
};
