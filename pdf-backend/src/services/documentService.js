const Document = require('../models/Document');

class DocumentService {
  async list({ userId, search, status, sort = '-updatedAt', page = 1, limit = 50 }) {
    const query = { userId, deletedFromDashboard: { $ne: true } };
    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };
    
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Document.find(query).sort(sort).skip(skip).limit(limit),
      Document.countDocuments(query),
    ]);
    return { docs, total, page, pages: Math.ceil(total / limit) };
  }

  async listAll({ userId, search, status, sort = '-updatedAt', folderId }) {
    const query = { userId };
    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };
    if (folderId !== undefined) {
      query.folderId = folderId || null;
    }
    return Document.find(query).sort(sort);
  }

  async getById(id, userId) {
    return Document.findOne({ _id: id, userId });
  }

  async create(data) {
    return Document.create(data);
  }

  async update(id, userId, data) {
    return Document.findOneAndUpdate(
      { _id: id, userId },
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async softDelete(id, userId) {
    return Document.findOneAndUpdate(
      { _id: id, userId },
      { deletedFromDashboard: true, updatedAt: new Date() },
      { new: true }
    );
  }

  async delete(id, userId) {
    return Document.findOneAndDelete({ _id: id, userId });
  }

  async permanentDelete(ids, userId) {
    const result = await Document.deleteMany({ _id: { $in: ids }, userId });
    return result.deletedCount;
  }

  async duplicate(id, userId) {
    const doc = await Document.findOne({ _id: id, userId });
    if (!doc) return null;
    const clone = doc.toObject();
    delete clone._id;
    delete clone.id;
    clone.title = `${clone.title} (Salinan)`;
    clone.status = 'draft';
    clone.deletedFromDashboard = false;
    return Document.create(clone);
  }

  async bulkDelete(ids, userId) {
    // Soft delete from dashboard
    const result = await Document.updateMany(
      { _id: { $in: ids }, userId },
      { deletedFromDashboard: true, updatedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async moveToFolder(id, userId, folderId) {
    return Document.findOneAndUpdate(
      { _id: id, userId },
      { folderId: folderId || null, updatedAt: new Date() },
      { new: true }
    );
  }

  async moveFolderDocsToRoot(folderId, userId) {
    return Document.updateMany(
      { folderId, userId },
      { folderId: null }
    );
  }

  async getStats(userId) {
    const [total, draft, finished, monthly] = await Promise.all([
      Document.countDocuments({ userId }),
      Document.countDocuments({ userId, status: 'draft' }),
      Document.countDocuments({ userId, status: 'finished' }),
      Document.aggregate([
        { $match: { userId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);
    return { total, draft, finished, monthly };
  }

  async importDocs(docs, userId) {
    const created = await Document.insertMany(docs.map(d => {
      const { id, _id, ...rest } = d;
      return { ...rest, userId, status: 'draft', deletedFromDashboard: false };
    }));
    return created.length;
  }

  async findByCode(code) {
    return Document.findOne({ docCode: code });
  }

  async exportDocs(ids, userId) {
    const query = { userId };
    if (ids && ids.length > 0) query._id = { $in: ids };
    return Document.find(query);
  }

  async listPublished() {
    return Document.find({ isPublished: true }).sort('-updatedAt');
  }

  async forkDocument(originalId, newUserId) {
    const original = await Document.findOne({ _id: originalId, isPublished: true });
    if (!original) return null;
    const clone = original.toObject();
    delete clone._id;
    delete clone.id;
    clone.userId = newUserId;
    clone.isPublished = false;
    clone.deletedFromDashboard = false;
    clone.status = 'draft';
    clone.docCode = require('crypto').randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    return Document.create(clone);
  }

  async togglePublish(id, userId, isPublished) {
    return Document.findOneAndUpdate(
      { _id: id, userId },
      { isPublished, updatedAt: new Date() },
      { new: true }
    );
  }
}

module.exports = new DocumentService();
