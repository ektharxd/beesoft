
require('dotenv').config();
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
// Dummy JWT middleware (replace with Supabase Auth if needed)
const verifyToken = (req, res, next) => { next(); };

// GET /api/admin/devices/stats - Get device statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { data: devices, error } = await supabase.from('devices').select('*');
    if (error) return res.status(500).json({ error: error.message });

    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    let totalDevices = 0;
    let onlineDevices = 0;
    let offlineDevices = 0;
    let bannedDevices = 0;
    let activeSubscriptions = 0;
    let permanentLicenses = 0;
    let trialLicenses = 0;
    let platformCounts = {};

    (devices || []).forEach(device => {
      totalDevices++;
      if (device.is_banned) bannedDevices++;
      if (device.platform) {
        platformCounts[device.platform] = (platformCounts[device.platform] || 0) + 1;
      }
      const isOnline = device.last_seen && new Date(device.last_seen) > twoMinutesAgo;
      if (isOnline) onlineDevices++;
      else offlineDevices++;
      
      // Count subscription types
      if (device.subscription_active && !device.is_banned) {
        activeSubscriptions++;
        if (device.subscription_type === 'permanent') {
          permanentLicenses++;
        } else if (device.subscription_type === 'trial') {
          // Check if trial is still valid
          if (!device.subscription_expires_at || new Date(device.subscription_expires_at) > now) {
            trialLicenses++;
          }
        }
      }
    });

    res.json({
      totalDevices,
      onlineDevices,
      offlineDevices,
      bannedDevices,
      activeSubscriptions,
      permanentLicenses,
      trialLicenses,
      platformDistribution: platformCounts
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({ error: 'Failed to fetch device statistics' });
  }
});

// GET /api/admin/devices - Get all devices with filtering and pagination
router.get('/', verifyToken, async function(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      platform,
      search,
      sortBy = 'last_seen',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase.from('devices').select('*', { count: 'exact' });

    // Filtering
    if (platform) query = query.eq('platform', platform);
    if (search) {
      // Simple search on name, email, username, machine_id, hostname, ip
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,name.ilike.%${search}%,machine_id.ilike.%${search}%,hostname.ilike.%${search}%,ip.ilike.%${search}%`);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder !== 'desc' });

    // Pagination
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: devices, count: total, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Add computed fields
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const enrichedDevices = (devices || []).map(device => {
      const isOnline = device.last_seen && new Date(device.last_seen) > twoMinutesAgo;
      
      // Calculate subscription status
      let subscriptionStatus = 'inactive';
      let daysRemaining = 0;
      
      if (device.is_banned) {
        subscriptionStatus = 'banned';
      } else if (device.subscription_type === 'permanent' && device.subscription_active) {
        subscriptionStatus = 'permanent';
        daysRemaining = 9999; // Permanent
      } else if (device.subscription_type === 'trial' && device.subscription_active) {
        if (device.subscription_expires_at) {
          const expiryDate = new Date(device.subscription_expires_at);
          const timeDiff = expiryDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
          
          if (daysRemaining <= 0) {
            subscriptionStatus = 'expired';
          } else if (daysRemaining <= 3) {
            subscriptionStatus = 'expiring_soon';
          } else if (daysRemaining <= 7) {
            subscriptionStatus = 'expiring_warning';
          } else {
            subscriptionStatus = 'active';
          }
        } else {
          subscriptionStatus = 'active';
        }
      }
      
      // Create subscription object for compatibility
      const subscription = device.subscription_type ? {
        type: device.subscription_type,
        active: device.subscription_active,
        messageLimit: device.message_limit,
        dailyMessageLimit: device.daily_message_limit,
        messagesUsed: device.messages_used || 0,
        dailyMessagesUsed: device.daily_messages_used || 0,
        start: device.subscription_activated_at,
        expires: device.subscription_expires_at,
        key: device.license_key
      } : null;
      
      return {
        ...device,
        machineId: device.machine_id,
        lastSeen: device.last_seen,
        isBanned: device.is_banned,
        isOnline,
        subscriptionStatus,
        daysRemaining,
        subscription,
        customer_name: device.name || device.username,
        username: device.username,
        email: device.email,
        phone: device.mobile
      };
    });

    res.json({
      devices: enrichedDevices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil((total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/devices/:machineId - Get specific device details
router.get('/:machineId', verifyToken, async (req, res) => {
  try {
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (error || !device) {
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
    
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (fetchError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Create trial subscription data
    const trialData = {
      subscription_type: 'trial',
      subscription_active: true,
      subscription_expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      subscription_activated_by: req.admin?.username || 'admin',
      subscription_activated_at: new Date().toISOString(),
      message_limit: messageLimit || 0,
      daily_message_limit: dailyMessageLimit || 0,
      messages_used: 0,
      daily_messages_used: 0,
      last_daily_reset: new Date().toISOString()
    };
    
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update(trialData)
      .eq('machine_id', req.params.machineId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating device:', updateError);
      return res.status(500).json({ error: 'Failed to activate trial' });
    }
    
    const limitInfo = [];
    if (messageLimit > 0) limitInfo.push(`${messageLimit} total messages`);
    if (dailyMessageLimit > 0) limitInfo.push(`${dailyMessageLimit} daily messages`);
    
    const limitText = limitInfo.length > 0 ? ` with limits: ${limitInfo.join(', ')}` : '';
    
    res.json({ 
      success: true, 
      message: `Trial activated for ${days} days${limitText}`,
      device: updatedDevice
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
    
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (deviceError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check if key exists and is valid
    const { data: licenseKey, error: keyError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key', key)
      .single();
    
    if (keyError || !licenseKey) {
      return res.status(400).json({ error: 'Invalid license key' });
    }
    
    if (licenseKey.used && licenseKey.assigned_to !== req.params.machineId) {
      return res.status(400).json({ error: 'License key already used by another device' });
    }
    
    if (!licenseKey.is_active) {
      return res.status(400).json({ error: 'License key has been deactivated' });
    }
    
    if (licenseKey.expires_at && new Date() > new Date(licenseKey.expires_at)) {
      return res.status(400).json({ error: 'License key has expired' });
    }
    
    // Use the key
    const { error: keyUpdateError } = await supabase
      .from('license_keys')
      .update({
        used: true,
        assigned_to: req.params.machineId,
        used_at: new Date().toISOString(),
        device_info: {
          username: device.username,
          platform: device.platform,
          hostname: device.hostname,
          email: device.email,
          mobile: device.mobile,
          name: device.name
        }
      })
      .eq('key', key);
    
    if (keyUpdateError) {
      console.error('Error updating license key:', keyUpdateError);
      return res.status(500).json({ error: 'Failed to use license key' });
    }
    
    // Activate permanent license on device
    const { data: updatedDevice, error: deviceUpdateError } = await supabase
      .from('devices')
      .update({
        subscription_type: 'permanent',
        subscription_active: true,
        subscription_expires_at: null,
        subscription_activated_by: req.admin?.username || 'admin',
        subscription_activated_at: new Date().toISOString(),
        license_key: key
      })
      .eq('machine_id', req.params.machineId)
      .select()
      .single();
    
    if (deviceUpdateError) {
      console.error('Error updating device:', deviceUpdateError);
      return res.status(500).json({ error: 'Failed to activate permanent license' });
    }
    
    res.json({ 
      success: true, 
      message: 'Permanent license activated successfully',
      device: updatedDevice
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
    
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (fetchError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (device.is_banned) {
      return res.status(400).json({ error: 'Device is already banned' });
    }
    
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_by: req.admin?.username || 'admin',
        banned_at: new Date().toISOString()
      })
      .eq('machine_id', req.params.machineId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating device:', updateError);
      return res.status(500).json({ error: 'Failed to ban device' });
    }
    
    res.json({ 
      success: true, 
      message: 'Device banned successfully',
      device: updatedDevice
    });
    
  } catch (error) {
    console.error('Error banning device:', error);
    res.status(500).json({ error: 'Failed to ban device' });
  }
});

// POST /api/admin/devices/:machineId/unban - Unban device
router.post('/:machineId/unban', verifyToken, async (req, res) => {
  try {
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (fetchError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!device.is_banned) {
      return res.status(400).json({ error: 'Device is not banned' });
    }
    
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        banned_at: null,
        unbanned_by: req.admin?.username || 'admin',
        unbanned_at: new Date().toISOString()
      })
      .eq('machine_id', req.params.machineId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating device:', updateError);
      return res.status(500).json({ error: 'Failed to unban device' });
    }
    
    res.json({ 
      success: true, 
      message: 'Device unbanned successfully',
      device: updatedDevice
    });
    
  } catch (error) {
    console.error('Error unbanning device:', error);
    res.status(500).json({ error: 'Failed to unban device' });
  }
});

// DELETE /api/admin/devices/:machineId - Remove device
router.delete('/:machineId', verifyToken, async function(req, res) {
  try {
    const { data, error } = await supabase
      .from('devices')
      .delete()
      .eq('machine_id', req.params.machineId);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ success: true, message: 'Device removed successfully' });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

// PUT /api/admin/devices/:machineId - Update device details
router.put('/:machineId', verifyToken, async (req, res) => {
  try {
    const { username, email, mobile, name } = req.body;
    
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();
    
    if (fetchError || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (name) updateData.name = name;
    
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update(updateData)
      .eq('machine_id', req.params.machineId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating device:', updateError);
      return res.status(500).json({ error: 'Failed to update device' });
    }
    
    res.json({ 
      success: true, 
      message: 'Device updated successfully',
      device: updatedDevice
    });
    
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// POST /api/admin/devices/:machineId/update-limits - Update message limits
router.post('/:machineId/update-limits', verifyToken, async (req, res) => {
  try {
    const { totalMessageLimit, dailyMessageLimit } = req.body;
    console.log('[update-limits] Request body:', req.body);

    if (totalMessageLimit === undefined || dailyMessageLimit === undefined) {
      return res.status(400).json({ error: 'Both totalMessageLimit and dailyMessageLimit are required' });
    }

    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', req.params.machineId)
      .single();

    if (fetchError || !device) {
      console.error('[update-limits] Device not found:', req.params.machineId);
      return res.status(404).json({ error: 'Device not found', machineId: req.params.machineId });
    }

    // If device doesn't have an active subscription, we can still set limits for future use
    // But we'll warn the user about it
    let warningMessage = '';
    if (!device.subscription_type || !device.subscription_active) {
      warningMessage = 'Note: Device does not have an active subscription. Limits will be applied when a subscription is activated.';
    }

    // Allow setting limits for any subscription type, but warn if it's permanent
    if (device.subscription_type === 'permanent') {
      warningMessage = 'Note: This is a permanent subscription. Message limits may not apply.';
    }

    // Update message limits
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({
        message_limit: parseInt(totalMessageLimit) || 0,
        daily_message_limit: parseInt(dailyMessageLimit) || 0
      })
      .eq('machine_id', req.params.machineId)
      .select()
      .single();

    if (updateError) {
      console.error('[update-limits] Error updating device:', updateError);
      return res.status(500).json({ error: 'Failed to update message limits', details: updateError.message });
    }

    res.json({ 
      success: true, 
      message: warningMessage ? `Message limits updated successfully. ${warningMessage}` : 'Message limits updated successfully',
      device: updatedDevice,
      warning: warningMessage
    });
  } catch (error) {
    console.error('[update-limits] Error updating message limits:', error);
    res.status(500).json({ error: 'Failed to update message limits', details: error.message, stack: error.stack });
  }
});

module.exports = router;