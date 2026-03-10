const Document = require('../models/Document');

class DocumentService {
  async list({ search, status, sort = '-updatedAt', page = 1, limit = 50 }) {
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };
    
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Document.find(query).sort(sort).skip(skip).limit(limit),
      Document.countDocuments(query),
    ]);
    return { docs, total, page, pages: Math.ceil(total / limit) };
  }

  async getById(id) {
    return Document.findById(id);
  }

  async create(data) {
    return Document.create(data);
  }

  async update(id, data) {
    return Document.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true, runValidators: true });
  }

  async delete(id) {
    return Document.findByIdAndDelete(id);
  }

  async duplicate(id) {
    const doc = await Document.findById(id);
    if (!doc) return null;
    const clone = doc.toObject();
    delete clone._id;
    delete clone.id;
    clone.title = `${clone.title} (Salinan)`;
    clone.status = 'draft';
    return Document.create(clone);
  }

  async bulkDelete(ids) {
    const result = await Document.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async getStats() {
    const [total, draft, finished, monthly] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: 'draft' }),
      Document.countDocuments({ status: 'finished' }),
      Document.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);
    return { total, draft, finished, monthly };
  }

  async importDocs(docs) {
    const created = await Document.insertMany(docs.map(d => {
      const { id, _id, ...rest } = d;
      return { ...rest, status: 'draft' };
    }));
    return created.length;
  }

  async findByCode(code) {
    return Document.findOne({ docCode: code });
  }
}

module.exports = new DocumentService();
