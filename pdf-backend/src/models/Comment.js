const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  shareCode: { type: String, required: true, index: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

CommentSchema.index({ documentId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
