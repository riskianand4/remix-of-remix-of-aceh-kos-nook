const mongoose = require('mongoose');

const DocumentVersionSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  documentId: { type: String, required: true, index: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('DocumentVersion', DocumentVersionSchema);
