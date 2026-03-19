const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  name: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  googleId: { type: String, default: null, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, default: () => crypto.randomUUID() },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.verificationToken;
      delete ret.resetToken;
      delete ret.resetTokenExpiry;
      return ret;
    }
  },
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
