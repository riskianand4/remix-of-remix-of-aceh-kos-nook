const mongoose = require('mongoose');

const ShareLinkSchema = new mongoose.Schema({
  documentId: { type: String, ref: 'Document', required: true, index: true },
  code: { type: String, required: true, index: true },
  accessCode: { type: String, required: true },
  createdBy: { type: String, default: '' },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

ShareLinkSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('ShareLink', ShareLinkSchema);
