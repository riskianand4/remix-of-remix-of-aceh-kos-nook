const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  parentId: { type: String, default: null, index: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true },
});

FolderSchema.index({ userId: 1, parentId: 1 });

module.exports = mongoose.model('Folder', FolderSchema);
