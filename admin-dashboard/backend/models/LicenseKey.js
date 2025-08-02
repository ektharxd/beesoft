const mongoose = require('mongoose');

const LicenseKeySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  },
  type: { 
    type: String, 
    enum: ['permanent', 'trial'],
    default: 'permanent'
  },
  days: { type: Number, default: 9999 }, // For trial keys
  
  // Usage tracking
  used: { type: Boolean, default: false },
  assignedTo: String, // machineId
  usedAt: Date,
  
  // Device info when used
  deviceInfo: {
    username: String,
    platform: String,
    hostname: String,
    email: String,
    mobile: String,
    name: String
  },
  
  // Key metadata
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date, // Optional expiry for the key itself
  
  // Additional info
  description: String,
  batchId: String, // For bulk key generation
  
  // Status
  isActive: { type: Boolean, default: true },
  deactivatedAt: Date,
  deactivatedBy: String,
  deactivationReason: String
});

// Virtual for key status
LicenseKeySchema.virtual('status').get(function() {
  if (!this.isActive) return 'deactivated';
  if (this.expiresAt && new Date() > this.expiresAt) return 'expired';
  if (this.used) return 'used';
  return 'available';
});

// Method to generate a random license key
LicenseKeySchema.statics.generateKey = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};

// Method to generate multiple keys
LicenseKeySchema.statics.generateBatch = async function(count, createdBy, options = {}) {
  const keys = [];
  const batchId = new mongoose.Types.ObjectId().toString();
  
  for (let i = 0; i < count; i++) {
    let key;
    let attempts = 0;
    
    // Ensure unique key
    do {
      key = this.generateKey();
      attempts++;
      if (attempts > 100) throw new Error('Unable to generate unique key');
    } while (await this.findOne({ key }));
    
    keys.push({
      key,
      type: options.type || 'permanent',
      days: options.days || 9999,
      createdBy,
      batchId,
      description: options.description || `Batch generated key ${i + 1}/${count}`,
      expiresAt: options.expiresAt
    });
  }
  
  return await this.insertMany(keys);
};

// Method to use a key
LicenseKeySchema.methods.useKey = function(machineId, deviceInfo) {
  if (this.used && this.assignedTo !== machineId) {
    throw new Error('Key already used by another device');
  }
  
  if (this.expiresAt && new Date() > this.expiresAt) {
    throw new Error('Key has expired');
  }
  
  if (!this.isActive) {
    throw new Error('Key has been deactivated');
  }
  
  this.used = true;
  this.assignedTo = machineId;
  this.usedAt = new Date();
  this.deviceInfo = deviceInfo;
  
  return this.save();
};

// Method to deactivate key
LicenseKeySchema.methods.deactivate = function(reason, deactivatedBy) {
  this.isActive = false;
  this.deactivatedAt = new Date();
  this.deactivatedBy = deactivatedBy;
  this.deactivationReason = reason;
  
  return this.save();
};

// Ensure virtuals are included in JSON output
LicenseKeySchema.set('toJSON', { virtuals: true });
LicenseKeySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LicenseKey', LicenseKeySchema);