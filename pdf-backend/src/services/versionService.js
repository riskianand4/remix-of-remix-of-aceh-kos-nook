const DocumentVersion = require('../models/DocumentVersion');
const config = require('../config');

class VersionService {
  async list(documentId) {
    return DocumentVersion.find({ documentId }).sort('-createdAt').limit(config.MAX_VERSIONS_PER_DOC);
  }

  async save(documentId, snapshot) {
    // Store full snapshot including images (don't strip — images are part of the document)
    const version = await DocumentVersion.create({ documentId, snapshot });
    
    // Prune old versions beyond limit
    const count = await DocumentVersion.countDocuments({ documentId });
    if (count > config.MAX_VERSIONS_PER_DOC) {
      const oldest = await DocumentVersion.find({ documentId })
        .sort('createdAt')
        .limit(count - config.MAX_VERSIONS_PER_DOC)
        .select('_id');
      await DocumentVersion.deleteMany({ _id: { $in: oldest.map(v => v._id) } });
    }
    return version;
  }

  async restore(documentId, versionId) {
    const version = await DocumentVersion.findOne({ _id: versionId, documentId });
    return version ? version.snapshot : null;
  }

  async deleteAll(documentId) {
    return DocumentVersion.deleteMany({ documentId });
  }
}

module.exports = new VersionService();
