const mongoose = require('mongoose');

const HeartbeatSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: 'unknown' },
  version: { type: String, default: 'unknown' },
  platform: { type: String, default: 'unknown' },
  hostname: { type: String, default: 'unknown' },
});

module.exports = mongoose.model('Heartbeat', HeartbeatSchema);
