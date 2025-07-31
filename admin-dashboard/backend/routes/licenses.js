require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Connect to MongoDB if not already connected
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('Connected to MongoDB (licenses.js)');
  }).catch((err) => {
    console.error('MongoDB connection error (licenses.js):', err.message);
  });
}

const LicenseKey = require('../models/LicenseKey');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beesoft_secret');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/admin/licenses - Get all license keys with filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter query
    const filter = {};
    
    if (status) {
      switch (status) {
        case 'available':
          filter.used = false;
          filter.isActive = true;
          filter.$or = [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ];
          break;
        case 'used':
          filter.used = true;
          break;
        case 'expired':
          filter.expiresAt = { $lt: new Date() };
          break;
        case 'deactivated':
          filter.isActive = false;
          break;
      }
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignedTo: { $regex: search, $options: 'i' } },
        { 'deviceInfo.username': { $regex: search, $options: 'i' } },
        { 'deviceInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const licenses = await LicenseKey.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await LicenseKey.countDocuments(filter);
    
    res.json({
      licenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// GET /api/admin/licenses/stats - Get license statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    
    const stats = await LicenseKey.aggregate([
      {
        $addFields: {
          isExpired: { $lt: ['$expiresAt', now] },
          isAvailable: {
            $and: [
              { $eq: ['$used', false] },
              { $eq: ['$isActive', true] },
              {
                $or: [
                  { $eq: ['$expiresAt', null] },
                  { $gt: ['$expiresAt', now] }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
          availableKeys: { $sum: { $cond: ['$isAvailable', 1, 0] } },
          usedKeys: { $sum: { $cond: ['$used', 1, 0] } },
          expiredKeys: { $sum: { $cond: ['$isExpired', 1, 0] } },
          deactivatedKeys: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          permanentKeys: { $sum: { $cond: [{ $eq: ['$type', 'permanent'] }, 1, 0] } },
          trialKeys: { $sum: { $cond: [{ $eq: ['$type', 'trial'] }, 1, 0] } }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalKeys: 0,
      availableKeys: 0,
      usedKeys: 0,
      expiredKeys: 0,
      deactivatedKeys: 0,
      permanentKeys: 0,
      trialKeys: 0
    };
    
    delete result._id;
    
    res.json(result);
    
  } catch (error) {
    console.error('Error fetching license stats:', error);
    res.status(500).json({ error: 'Failed to fetch license statistics' });
  }
});

// POST /api/admin/licenses/generate - Generate new license keys
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { 
      count = 1, 
      type = 'permanent', 
      days = 9999, 
      description,
      expiresAt 
    } = req.body;
    
    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }
    
    if (type === 'trial' && (!days || days < 1 || days > 365)) {
      return res.status(400).json({ error: 'Trial days must be between 1 and 365' });
    }
    
    const options = {
      type,
      days: type === 'trial' ? days : 9999,
      description: description || `${type} license key`,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    };
    
    const keys = await LicenseKey.generateBatch(count, req.admin.username, options);
    
    res.json({
      success: true,
      message: `Generated ${count} license key(s)`,
      keys: keys
    });
    
  } catch (error) {
    console.error('Error generating license keys:', error);
    res.status(500).json({ error: 'Failed to generate license keys' });
  }
});

// POST /api/admin/licenses/:keyId/deactivate - Deactivate a license key
router.post('/:keyId/deactivate', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Deactivation reason is required' });
    }
    
    const licenseKey = await LicenseKey.findById(req.params.keyId);
    
    if (!licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    
    if (!licenseKey.isActive) {
      return res.status(400).json({ error: 'License key is already deactivated' });
    }
    
    await licenseKey.deactivate(reason, req.admin.username);
    
    res.json({
      success: true,
      message: 'License key deactivated successfully',
      key: licenseKey
    });
    
  } catch (error) {
    console.error('Error deactivating license key:', error);
    res.status(500).json({ error: 'Failed to deactivate license key' });
  }
});

// POST /api/admin/licenses/:keyId/reactivate - Reactivate a license key
router.post('/:keyId/reactivate', verifyToken, async (req, res) => {
  try {
    const licenseKey = await LicenseKey.findById(req.params.keyId);
    
    if (!licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    
    if (licenseKey.isActive) {
      return res.status(400).json({ error: 'License key is already active' });
    }
    
    licenseKey.isActive = true;
    licenseKey.deactivatedAt = undefined;
    licenseKey.deactivatedBy = undefined;
    licenseKey.deactivationReason = undefined;
    
    await licenseKey.save();
    
    res.json({
      success: true,
      message: 'License key reactivated successfully',
      key: licenseKey
    });
    
  } catch (error) {
    console.error('Error reactivating license key:', error);
    res.status(500).json({ error: 'Failed to reactivate license key' });
  }
});

// DELETE /api/admin/licenses/:keyId - Delete a license key
router.delete('/:keyId', verifyToken, async (req, res) => {
  try {
    const licenseKey = await LicenseKey.findById(req.params.keyId);
    
    if (!licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    
    if (licenseKey.used) {
      return res.status(400).json({ error: 'Cannot delete a used license key' });
    }
    
    await LicenseKey.findByIdAndDelete(req.params.keyId);
    
    res.json({
      success: true,
      message: 'License key deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting license key:', error);
    res.status(500).json({ error: 'Failed to delete license key' });
  }
});

// GET /api/admin/licenses/:key/validate - Validate a specific license key
router.get('/:key/validate', verifyToken, async (req, res) => {
  try {
    const licenseKey = await LicenseKey.findOne({ key: req.params.key });
    
    if (!licenseKey) {
      return res.json({ valid: false, reason: 'Key not found' });
    }
    
    if (!licenseKey.isActive) {
      return res.json({ valid: false, reason: 'Key deactivated', key: licenseKey });
    }
    
    if (licenseKey.expiresAt && new Date() > licenseKey.expiresAt) {
      return res.json({ valid: false, reason: 'Key expired', key: licenseKey });
    }
    
    if (licenseKey.used) {
      return res.json({ 
        valid: false, 
        reason: 'Key already used', 
        key: licenseKey,
        assignedTo: licenseKey.assignedTo 
      });
    }
    
    res.json({ 
      valid: true, 
      key: licenseKey 
    });
    
  } catch (error) {
    console.error('Error validating license key:', error);
    res.status(500).json({ error: 'Failed to validate license key' });
  }
});

module.exports = router;