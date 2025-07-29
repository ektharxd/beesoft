const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const LicenseKey = require('../models/LicenseKey');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, 'beesoft_secret');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/admin/devices - Get all devices with filtering and pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      platform, 
      search,
      sortBy = 'lastSeen',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (status) {
      switch (status) {
        case 'online':
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          filter.lastSeen = { $gt: twoMinutesAgo };
          break;
        case 'offline':
          const twoMinutesAgoOffline = new Date(Date.now() - 2 * 60 * 1000);
          filter.lastSeen = { $lte: twoMinutesAgoOffline };
          break;
        case 'banned':
          filter.isBanned = true;
          break;
        case 'active_subscription':
          filter['subscription.active'] = true;
          filter.isBanned = false;
          break;
        case 'expired':
          filter['subscription.type'] = 'trial';
          filter['subscription.active'] = true;
          // Add expiry check in aggregation
          break;
      }
    }
    
    if (platform) {
      filter.platform = platform;
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { machineId: { $regex: search, $options: 'i' } },
        { hostname: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const devices = await Device.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Device.countDocuments(filter);
    
    // Add computed fields
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    const enrichedDevices = devices.map(device => {
      const isOnline = new Date(device.lastSeen) > twoMinutesAgo;
      
      let subscriptionStatus = 'inactive';
      let daysRemaining = 0;
      
      if (device.isBanned) {
        subscriptionStatus = 'banned';
      } else if (device.subscription && device.subscription.active) {
        if (device.subscription.type === 'permanent') {
          subscriptionStatus = 'permanent';
          daysRemaining = 9999;
        } else if (device.subscription.type === 'trial' && device.subscription.start) {
          const expiryDate = new Date(device.subscription.start.getTime() + (device.subscription.days * 24 * 60 * 60 * 1000));
          daysRemaining = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
          
          if (daysRemaining <= 0) {
            subscriptionStatus = 'expired';
            daysRemaining = 0;
          } else if (daysRemaining <= 1) {
            subscriptionStatus = 'expiring_soon';
          } else if (daysRemaining <= 3) {
            subscriptionStatus = 'expiring_warning';
          } else {
            subscriptionStatus = 'active';
          }
        }
      }
      
      return {
        ...device,
        isOnline,
        subscriptionStatus,
        daysRemaining
      };
    });
    
    res.json({
      devices: enrichedDevices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/admin/devices/stats - Get device statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    const stats = await Device.aggregate([
      {
        $addFields: {
          isOnline: { $gt: ['$lastSeen', twoMinutesAgo] },
          isTrialExpired: {
            $and: [
              { $eq: ['$subscription.type', 'trial'] },
              { $eq: ['$subscription.active', true] },
              { 
                $lt: [
                  { $add: ['$subscription.start', { $multiply: ['$subscription.days', 24 * 60 * 60 * 1000] }] },
                  now
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          onlineDevices: { $sum: { $cond: ['$isOnline', 1, 0] } },
          offlineDevices: { $sum: { $cond: ['$isOnline', 0, 1] } },
          bannedDevices: { $sum: { $cond: ['$isBanned', 1, 0] } },
          activeSubscriptions: { 
            $sum: { 
              $cond: [
                { $and: ['$subscription.active', { $not: '$isBanned' }] }, 
                1, 
                0
              ] 
            } 
          },
          permanentLicenses: { 
            $sum: { 
              $cond: [
                { $and: ['$subscription.active', { $eq: ['$subscription.type', 'permanent'] }] }, 
                1, 
                0
              ] 
            } 
          },
          trialLicenses: { 
            $sum: { 
              $cond: [
                { $and: ['$subscription.active', { $eq: ['$subscription.type', 'trial'] }] }, 
                1, 
                0
              ] 
            } 
          },
          expiredTrials: { $sum: { $cond: ['$isTrialExpired', 1, 0] } },
          platformStats: {
            $push: '$platform'
          }
        }
      }
    ]);
    
    // Platform distribution
    const platformCounts = {};
    if (stats[0] && stats[0].platformStats) {
      stats[0].platformStats.forEach(platform => {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
    }
    
    const result = stats[0] || {
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      bannedDevices: 0,
      activeSubscriptions: 0,
      permanentLicenses: 0,
      trialLicenses: 0,
      expiredTrials: 0
    };
    
    result.platformDistribution = platformCounts;
    delete result.platformStats;
    delete result._id;
    
    res.json(result);
    
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({ error: 'Failed to fetch device statistics' });
  }
});

// GET /api/admin/devices/:machineId - Get specific device details
router.get('/:machineId', verifyToken, async (req, res) => {
  try {
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(device);
    
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// POST /api/admin/devices/:machineId/trial - Activate trial for device
router.post('/:machineId/trial', verifyToken, async (req, res) => {
  try {
    const { days, messageLimit, dailyMessageLimit } = req.body;
    
    if (!days || days < 1 || days > 365) {
      return res.status(400).json({ error: 'Days must be between 1 and 365' });
    }
    
    // Validate message limits
    if (messageLimit !== undefined && messageLimit < 0) {
      return res.status(400).json({ error: 'Message limit cannot be negative' });
    }
    
    if (dailyMessageLimit !== undefined && dailyMessageLimit < 0) {
      return res.status(400).json({ error: 'Daily message limit cannot be negative' });
    }
    
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Prepare options for trial activation
    const options = {};
    if (messageLimit !== undefined) options.messageLimit = messageLimit;
    if (dailyMessageLimit !== undefined) options.dailyMessageLimit = dailyMessageLimit;
    
    device.activateTrial(days, req.admin.username, options);
    await device.save();
    
    const limitInfo = [];
    if (messageLimit > 0) limitInfo.push(`${messageLimit} total messages`);
    if (dailyMessageLimit > 0) limitInfo.push(`${dailyMessageLimit} daily messages`);
    
    const limitText = limitInfo.length > 0 ? ` with limits: ${limitInfo.join(', ')}` : '';
    
    res.json({ 
      success: true, 
      message: `Trial activated for ${days} days${limitText}`,
      device: device,
      messageStats: device.getMessageStats()
    });
    
  } catch (error) {
    console.error('Error activating trial:', error);
    res.status(500).json({ error: 'Failed to activate trial' });
  }
});

// POST /api/admin/devices/:machineId/permanent - Activate permanent license
router.post('/:machineId/permanent', verifyToken, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'License key is required' });
    }
    
    // Validate key format
    const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!keyPattern.test(key)) {
      return res.status(400).json({ error: 'Invalid key format' });
    }
    
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check if key exists and is valid
    const licenseKey = await LicenseKey.findOne({ key });
    
    if (!licenseKey) {
      return res.status(400).json({ error: 'Invalid license key' });
    }
    
    if (licenseKey.used && licenseKey.assignedTo !== req.params.machineId) {
      return res.status(400).json({ error: 'License key already used by another device' });
    }
    
    if (!licenseKey.isActive) {
      return res.status(400).json({ error: 'License key has been deactivated' });
    }
    
    if (licenseKey.expiresAt && new Date() > licenseKey.expiresAt) {
      return res.status(400).json({ error: 'License key has expired' });
    }
    
    // Use the key
    await licenseKey.useKey(req.params.machineId, {
      username: device.username,
      platform: device.platform,
      hostname: device.hostname,
      email: device.email,
      mobile: device.mobile,
      name: device.name
    });
    
    // Activate permanent license on device
    device.activatePermanent(key, req.admin.username);
    await device.save();
    
    res.json({ 
      success: true, 
      message: 'Permanent license activated successfully',
      device: device
    });
    
  } catch (error) {
    console.error('Error activating permanent license:', error);
    res.status(500).json({ error: error.message || 'Failed to activate permanent license' });
  }
});

// POST /api/admin/devices/:machineId/ban - Ban device
router.post('/:machineId/ban', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Ban reason is required' });
    }
    
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (device.isBanned) {
      return res.status(400).json({ error: 'Device is already banned' });
    }
    
    device.banDevice(reason, req.admin.username);
    await device.save();
    
    res.json({ 
      success: true, 
      message: 'Device banned successfully',
      device: device
    });
    
  } catch (error) {
    console.error('Error banning device:', error);
    res.status(500).json({ error: 'Failed to ban device' });
  }
});

// POST /api/admin/devices/:machineId/unban - Unban device
router.post('/:machineId/unban', verifyToken, async (req, res) => {
  try {
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!device.isBanned) {
      return res.status(400).json({ error: 'Device is not banned' });
    }
    
    device.unbanDevice(req.admin.username);
    await device.save();
    
    res.json({ 
      success: true, 
      message: 'Device unbanned successfully',
      device: device
    });
    
  } catch (error) {
    console.error('Error unbanning device:', error);
    res.status(500).json({ error: 'Failed to unban device' });
  }
});

// DELETE /api/admin/devices/:machineId - Remove device
router.delete('/:machineId', verifyToken, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Device removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

// PUT /api/admin/devices/:machineId - Update device details
router.put('/:machineId', verifyToken, async (req, res) => {
  try {
    const { username, email, mobile, name } = req.body;
    
    const device = await Device.findOne({ machineId: req.params.machineId });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Update fields if provided
    if (username) device.username = username;
    if (email) device.email = email;
    if (mobile) device.mobile = mobile;
    if (name) device.name = name;
    
    device.addLog({
      type: 'subscription_change',
      activatedBy: req.admin.username,
      details: { updatedFields: { username, email, mobile, name } }
    });
    
    await device.save();
    
    res.json({ 
      success: true, 
      message: 'Device updated successfully',
      device: device
    });
    
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

module.exports = router;