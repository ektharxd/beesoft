const mongoose = require('mongoose');

const DeviceLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ['heartbeat', 'registration', 'trial_activation', 'permanent_activation', 'subscription_change', 'ban', 'unban', 'message_usage', 'message_limits_update'],
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
  expiresAt: Date,
  
  // Message limits for trial users
  messageLimit: { type: Number, default: 0 }, // 0 = unlimited
  messagesUsed: { type: Number, default: 0 },
  lastMessageReset: { type: Date, default: Date.now },
  dailyMessageLimit: { type: Number, default: 0 }, // 0 = unlimited
  dailyMessagesUsed: { type: Number, default: 0 },
  lastDailyReset: { type: Date, default: Date.now }
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
DeviceSchema.methods.activateTrial = function(days, activatedBy, options = {}) {
  this.subscription = {
    type: 'trial',
    days: days,
    start: new Date(),
    active: true,
    activatedAt: new Date(),
    messageLimit: options.messageLimit || 100, // Default 100 messages for trial
    messagesUsed: 0,
    lastMessageReset: new Date(),
    dailyMessageLimit: options.dailyMessageLimit || 50, // Default 50 messages per day
    dailyMessagesUsed: 0,
    lastDailyReset: new Date()
  };
  
  this.addLog({
    type: 'trial_activation',
    days: days,
    activatedBy: activatedBy,
    details: { 
      days, 
      activatedBy, 
      messageLimit: this.subscription.messageLimit,
      dailyMessageLimit: this.subscription.dailyMessageLimit
    }
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
    activatedAt: new Date(),
    messageLimit: 0, // Unlimited for permanent
    messagesUsed: 0,
    dailyMessageLimit: 0, // Unlimited for permanent
    dailyMessagesUsed: 0
  };
  
  this.addLog({
    type: 'permanent_activation',
    key: key,
    activatedBy: activatedBy,
    details: { key, activatedBy }
  });
};

// Method to check if user can send messages
DeviceSchema.methods.canSendMessages = function(messageCount = 1) {
  if (!this.subscription || !this.subscription.active) return { allowed: false, reason: 'No active subscription' };
  if (this.subscription.type === 'permanent') return { allowed: true };
  if (this.subscription.type !== 'trial') return { allowed: false, reason: 'Invalid subscription type' };
  
  // Reset daily counter if it's a new day
  this.resetDailyCounterIfNeeded();
  
  // Check total message limit
  if (this.subscription.messageLimit > 0 && 
      (this.subscription.messagesUsed + messageCount) > this.subscription.messageLimit) {
    return { 
      allowed: false, 
      reason: 'Total message limit exceeded',
      messagesRemaining: Math.max(0, this.subscription.messageLimit - this.subscription.messagesUsed)
    };
  }
  
  // Check daily message limit
  if (this.subscription.dailyMessageLimit > 0 && 
      (this.subscription.dailyMessagesUsed + messageCount) > this.subscription.dailyMessageLimit) {
    return { 
      allowed: false, 
      reason: 'Daily message limit exceeded',
      dailyMessagesRemaining: Math.max(0, this.subscription.dailyMessageLimit - this.subscription.dailyMessagesUsed)
    };
  }
  
  return { 
    allowed: true,
    messagesRemaining: this.subscription.messageLimit > 0 ? 
      this.subscription.messageLimit - this.subscription.messagesUsed : -1,
    dailyMessagesRemaining: this.subscription.dailyMessageLimit > 0 ? 
      this.subscription.dailyMessageLimit - this.subscription.dailyMessagesUsed : -1
  };
};

// Method to track message usage
DeviceSchema.methods.trackMessageUsage = function(messageCount = 1) {
  if (!this.subscription || this.subscription.type !== 'trial') return;
  
  // Reset daily counter if it's a new day
  this.resetDailyCounterIfNeeded();
  
  // Update counters
  this.subscription.messagesUsed += messageCount;
  this.subscription.dailyMessagesUsed += messageCount;
  
  this.addLog({
    type: 'message_usage',
    details: { 
      messageCount,
      totalUsed: this.subscription.messagesUsed,
      dailyUsed: this.subscription.dailyMessagesUsed,
      totalLimit: this.subscription.messageLimit,
      dailyLimit: this.subscription.dailyMessageLimit
    }
  });
};

// Method to reset daily counter if needed
DeviceSchema.methods.resetDailyCounterIfNeeded = function() {
  if (!this.subscription || !this.subscription.lastDailyReset) return;
  
  const now = new Date();
  const lastReset = new Date(this.subscription.lastDailyReset);
  
  // Check if it's a new day (different date)
  if (now.toDateString() !== lastReset.toDateString()) {
    this.subscription.dailyMessagesUsed = 0;
    this.subscription.lastDailyReset = now;
  }
};

// Method to get message usage stats
DeviceSchema.methods.getMessageStats = function() {
  if (!this.subscription || this.subscription.type !== 'trial') {
    return {
      type: this.subscription?.type || 'none',
      unlimited: true
    };
  }
  
  this.resetDailyCounterIfNeeded();
  
  return {
    type: 'trial',
    unlimited: false,
    totalLimit: this.subscription.messageLimit,
    totalUsed: this.subscription.messagesUsed,
    totalRemaining: Math.max(0, this.subscription.messageLimit - this.subscription.messagesUsed),
    dailyLimit: this.subscription.dailyMessageLimit,
    dailyUsed: this.subscription.dailyMessagesUsed,
    dailyRemaining: Math.max(0, this.subscription.dailyMessageLimit - this.subscription.dailyMessagesUsed),
    lastDailyReset: this.subscription.lastDailyReset
  };
};

// Virtual for message usage percentage
DeviceSchema.virtual('messageUsagePercentage').get(function() {
  if (!this.subscription || this.subscription.type !== 'trial' || this.subscription.messageLimit === 0) {
    return 0;
  }
  return Math.round((this.subscription.messagesUsed / this.subscription.messageLimit) * 100);
});

// Virtual for daily message usage percentage
DeviceSchema.virtual('dailyMessageUsagePercentage').get(function() {
  if (!this.subscription || this.subscription.type !== 'trial' || this.subscription.dailyMessageLimit === 0) {
    return 0;
  }
  this.resetDailyCounterIfNeeded();
  return Math.round((this.subscription.dailyMessagesUsed / this.subscription.dailyMessageLimit) * 100);
});

// Ensure virtuals are included in JSON output
DeviceSchema.set('toJSON', { virtuals: true });
DeviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Device', DeviceSchema);