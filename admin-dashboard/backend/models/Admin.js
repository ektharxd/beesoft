const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ['superadmin', 'admin', 'manager'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


AdminSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

AdminSchema.methods.setPassword = async function(newPassword) {
  this.password = await bcrypt.hash(newPassword, 10);
  return this.save();
};

module.exports = mongoose.model('Admin', AdminSchema);
