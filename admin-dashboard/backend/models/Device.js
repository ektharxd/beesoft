const mongoose = require('mongoose');

const DeviceLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ['heartbeat', 'registration', 'trial_activation', 'permanent_activation', 'subscription_change', 'ban', 'unban'],
    required: true 
  },
  ip: { type: String, default: 'unknown' },
  version: { type: String, default: 'unknown' },
  whatsappConnected: { type: Boolean, default: false },
  sessionActive: { type: Boolean, default: false },
  username: String,
  email: String,
  mobile: String,
  name: String,
  days: Number,
  key: String,
  activatedBy: String,
  reason: String,
  details: mongoose.Schema.Types.Mixed
});

const SubscriptionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['trial', 'permanent', 'none'],
    default: 'none'
  },
  days: { type: Number, default: 0 },
  start: { type: Date },
  active: { type: Boolean, default: false },
  key: String,
  activatedAt: Date,
  expiresAt: Date
});

const DeviceSchema = new mongoose.Schema({
  machineId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  name: { type: String, required: true },
  
  // Device Info
  version: { type: String, default: 'unknown' },
  platform: { type: String, default: 'unknown' },
  hostname: { type: String, default: 'unknown' },
  ip: { type: String, default: 'unknown' },
  
  // Status
  whatsappConnected: { type: Boolean, default: false },
  sessionActive: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: String,
  bannedAt: Date,
  bannedBy: String,
  
  // Subscription
  subscription: { type: SubscriptionSchema, default: () => ({}) },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  
  // Logs
  logs: [DeviceLogSchema]
});

// Virtual for checking if device is online (last seen within 2 minutes)
DeviceSchema.virtual('isDeviceOnline').get(function() {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  return this.lastSeen > twoMinutesAgo;
});

// Virtual for subscription status
DeviceSchema.virtual('subscriptionStatus').get(function() {
  if (this.isBanned) return 'banned';
  if (!this.subscription || !this.subscription.active) return 'inactive';
  
  if (this.subscription.type === 'permanent') return 'permanent';
  
  if (this.subscription.type === 'trial') {
    const now = new Date();
    const expiryDate = new Date(this.subscription.start.getTime() + (this.subscription.days * 24 * 60 * 60 * 1000));
    
    if (now > expiryDate) return 'expired';
    
    const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
    if (daysLeft <= 1) return 'expiring_soon';
    if (daysLeft <= 3) return 'expiring_warning';
    
    return 'active';
  }
  
  return 'unknown';
});

// Virtual for days remaining
DeviceSchema.virtual('daysRemaining').get(function() {
  if (!this.subscription || this.subscription.type !== 'trial' || !this.subscription.start) return 0;
  
  const now = new Date();
  const expiryDate = new Date(this.subscription.start.getTime() + (this.subscription.days * 24 * 60 * 60 * 1000));
  const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
  
  return Math.max(0, daysLeft);
});

// Method to add log entry
DeviceSchema.methods.addLog = function(logData) {
  this.logs.push({
    ...logData,
    timestamp: new Date()
  });
  
  // Keep only last 100 logs to prevent document size issues
  if (this.logs.length > 100) {
    this.logs = this.logs.slice(-100);
  }
};

// Method to ban device
DeviceSchema.methods.banDevice = function(reason, bannedBy) {
  this.isBanned = true;
  this.banReason = reason;
  this.bannedAt = new Date();
  this.bannedBy = bannedBy;
  this.subscription.active = false;
  
  this.addLog({
    type: 'ban',
    reason: reason,
    activatedBy: bannedBy,
    details: { reason, bannedBy }
  });
};

// Method to unban device
DeviceSchema.methods.unbanDevice = function(unbannedBy) {
  this.isBanned = false;
  this.banReason = undefined;
  this.bannedAt = undefined;
  this.bannedBy = undefined;
  
  this.addLog({
    type: 'unban',
    activatedBy: unbannedBy,
    details: { unbannedBy }
  });
};

// Method to activate trial
DeviceSchema.methods.activateTrial = function(days, activatedBy) {
  this.subscription = {
    type: 'trial',
    days: days,
    start: new Date(),
    active: true,
    activatedAt: new Date()
  };
  
  this.addLog({
    type: 'trial_activation',
    days: days,
    activatedBy: activatedBy,
    details: { days, activatedBy }
  });
};

// Method to activate permanent license
DeviceSchema.methods.activatePermanent = function(key, activatedBy) {
  this.subscription = {
    type: 'permanent',
    days: 9999,
    start: new Date(),
    active: true,
    key: key,
    activatedAt: new Date()
  };
  
  this.addLog({
    type: 'permanent_activation',
    key: key,
    activatedBy: activatedBy,
    details: { key, activatedBy }
  });
};

// Ensure virtuals are included in JSON output
DeviceSchema.set('toJSON', { virtuals: true });
DeviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Device', DeviceSchema);