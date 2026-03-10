const mongoose = require('mongoose');

const CustomTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📄' },
  category: { type: String, default: 'custom' },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('CustomTemplate', CustomTemplateSchema);
