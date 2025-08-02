const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SuperadminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ['superadmin', 'admin', 'manager'], default: 'superadmin' },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'superadmin' }); // Explicitly set collection name

// Hash password before saving
SuperadminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

SuperadminSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

SuperadminSchema.methods.setPassword = async function(newPassword) {
  this.password = await bcrypt.hash(newPassword, 10);
  return this.save();
};

// Check if model already exists to avoid OverwriteModelError
module.exports = mongoose.models.Superadmin || mongoose.model('Superadmin', SuperadminSchema);
