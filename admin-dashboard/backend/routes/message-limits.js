// Fixed Express route for message limits (works with new database structure)
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Helper function to calculate message stats from device (updated for new structure)
function calculateMessageStatsFromDevice(device) {
  console.log('Calculating message stats for device:', device.machine_id);
  console.log('Device subscription data:', {
    subscription_type: device.subscription_type,
    subscription_active: device.subscription_active,
    message_limit: device.message_limit,
    daily_message_limit: device.daily_message_limit,
    messages_used: device.messages_used,
    daily_messages_used: device.daily_messages_used
  });

  // Use the new column structure
  const subscriptionType = device.subscription_type;
  const subscriptionActive = device.subscription_active;
  
  if (!subscriptionType || !subscriptionActive) {
    return {
      type: subscriptionType || 'none',
      unlimited: true,
      subscriptionActive: subscriptionActive || false,
      subscriptionType: subscriptionType || 'none',
    };
  }

  if (subscriptionType === 'permanent') {
    return {
      type: 'permanent',
      unlimited: true,
      subscriptionActive: true,
      subscriptionType: 'permanent',
    };
  }
  
  if (subscriptionType === 'trial') {
    const now = new Date();
    const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
    let dailyUsed = device.daily_messages_used || 0;
    
    // Reset daily usage if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      dailyUsed = 0;
    }
    
    const messageLimit = device.message_limit || 0;
    const dailyMessageLimit = device.daily_message_limit || 0;
    const messagesUsed = device.messages_used || 0;
    
    return {
      type: 'trial',
      unlimited: false,
      subscriptionActive: true,
      subscriptionType: 'trial',
      totalLimit: messageLimit,
      totalUsed: messagesUsed,
      totalRemaining: Math.max(0, messageLimit - messagesUsed),
      dailyLimit: dailyMessageLimit,
      dailyUsed: dailyUsed,
      dailyRemaining: Math.max(0, dailyMessageLimit - dailyUsed),
      lastDailyReset: device.last_daily_reset,
      subscriptionStart: device.subscription_activated_at,
      subscriptionExpires: device.subscription_expires_at,
      subscriptionKey: device.license_key,
    };
  }

  return {
    type: 'none',
    unlimited: true,
    subscriptionActive: false,
    subscriptionType: 'none',
  };
}

function checkCanSendMessagesFromDevice(device, messageCount = 1) {
  console.log('Checking if device can send messages:', device.machine_id, 'count:', messageCount);
  
  const now = new Date();
  
  if (!device.subscription_active) {
    return { allowed: false, reason: 'No active subscription' };
  }
  
  if (device.is_banned) {
    return { allowed: false, reason: 'Device is banned' };
  }
  
  if (device.subscription_type === 'permanent') {
    return { allowed: true, messagesRemaining: -1, dailyMessagesRemaining: -1 };
  }
  
  if (device.subscription_type !== 'trial') {
    return { allowed: false, reason: 'Invalid subscription type' };
  }
  
  // Check if trial has expired
  if (device.subscription_expires_at) {
    const expiryDate = new Date(device.subscription_expires_at);
    if (now > expiryDate) {
      return { allowed: false, reason: 'Trial subscription has expired' };
    }
  }
  
  // Check daily reset
  const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
  let dailyUsed = device.daily_messages_used || 0;
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }
  
  // Check total message limit
  const messageLimit = device.message_limit || 0;
  const messagesUsed = device.messages_used || 0;
  if (messageLimit > 0 && (messagesUsed + messageCount) > messageLimit) {
    return {
      allowed: false,
      reason: 'Total message limit exceeded',
      messagesRemaining: Math.max(0, messageLimit - messagesUsed),
      dailyMessagesRemaining: Math.max(0, (device.daily_message_limit || 0) - dailyUsed),
    };
  }
  
  // Check daily message limit
  const dailyMessageLimit = device.daily_message_limit || 0;
  if (dailyMessageLimit > 0 && (dailyUsed + messageCount) > dailyMessageLimit) {
    return {
      allowed: false,
      reason: 'Daily message limit exceeded',
      messagesRemaining: messageLimit > 0 ? Math.max(0, messageLimit - messagesUsed) : -1,
      dailyMessagesRemaining: Math.max(0, dailyMessageLimit - dailyUsed),
    };
  }
  
  return {
    allowed: true,
    messagesRemaining: messageLimit > 0 ? (messageLimit - messagesUsed) : -1,
    dailyMessagesRemaining: dailyMessageLimit > 0 ? (dailyMessageLimit - dailyUsed) : -1,
  };
}

// GET /api/message-limits?machineId=xxx
router.get('/', async (req, res) => {
  const machineId = req.query.machineId;
  console.log('Message limits GET request for machineId:', machineId);
  
  if (!machineId) {
    return res.status(400).json({ error: 'Machine ID is required' });
  }
  
  try {
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', machineId)
      .single();
    
    if (error || !device) {
      console.log('Device not found:', machineId);
      return res.json({
        success: true,
        messageStats: { type: 'none', unlimited: true },
        canSendMessages: true,
        reason: 'Device not registered',
        messagesRemaining: -1,
        dailyMessagesRemaining: -1,
      });
    }
    
    if (device.is_banned) {
      console.log('Device is banned:', machineId);
      return res.json({
        success: false,
        messageStats: { type: 'banned', unlimited: false },
        canSendMessages: false,
        reason: 'Device is banned',
        messagesRemaining: 0,
        dailyMessagesRemaining: 0,
      });
    }
    
    const messageStats = calculateMessageStatsFromDevice(device);
    const canSend = checkCanSendMessagesFromDevice(device, 1);
    
    console.log('Returning message stats:', messageStats);
    console.log('Can send messages:', canSend);
    
    return res.json({
      success: true,
      messageStats,
      canSendMessages: canSend.allowed,
      reason: canSend.reason,
      messagesRemaining: canSend.messagesRemaining,
      dailyMessagesRemaining: canSend.dailyMessagesRemaining,
    });
  } catch (error) {
    console.error('Error in message-limits GET:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/message-limits
router.post('/', async (req, res) => {
  const machineId = req.query.machineId || req.body.machineId;
  console.log('Message limits POST request for machineId:', machineId, 'body:', req.body);
  
  if (!machineId) {
    return res.status(400).json({ error: 'Machine ID is required' });
  }
  
  const body = req.body;
  
  try {
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', machineId)
      .single();
    
    if (error || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check if can send specific number of messages
    if (body.check) {
      const { messageCount = 1 } = body;
      const canSend = checkCanSendMessagesFromDevice(device, messageCount);
      const messageStats = calculateMessageStatsFromDevice(device);
      
      return res.json({
        success: true,
        allowed: canSend.allowed,
        reason: canSend.reason,
        messageCount,
        messagesRemaining: canSend.messagesRemaining,
        dailyMessagesRemaining: canSend.dailyMessagesRemaining,
        messageStats,
      });
    }
    
    // Track message usage
    if (body.track) {
      const { messageCount = 1 } = body;
      console.log('Tracking message usage:', messageCount, 'for device:', machineId);
      
      if (device.subscription_type === 'trial' && device.subscription_active) {
        const now = new Date();
        const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
        let dailyUsed = device.daily_messages_used || 0;
        
        // Reset daily usage if it's a new day
        if (now.toDateString() !== lastReset.toDateString()) {
          dailyUsed = 0;
        }
        
        const newTotalUsed = (device.messages_used || 0) + messageCount;
        const newDailyUsed = dailyUsed + messageCount;
        
        // Update the device with new usage
        const { error: updateError } = await supabase
          .from('devices')
          .update({
            messages_used: newTotalUsed,
            daily_messages_used: newDailyUsed,
            last_daily_reset: now.toISOString(),
          })
          .eq('machine_id', machineId);
        
        if (updateError) {
          console.error('Error updating message usage:', updateError);
          return res.status(500).json({ error: 'Failed to update message usage' });
        }
        
        // Get updated device data
        const { data: updatedDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();
        
        const messageStats = calculateMessageStatsFromDevice(updatedDevice);
        
        return res.json({
          success: true,
          message: `Tracked ${messageCount} messages`,
          messageStats,
        });
      } else {
        const messageStats = calculateMessageStatsFromDevice(device);
        return res.json({
          success: true,
          message: 'No tracking needed for this subscription type',
          messageStats,
        });
      }
    }
    
    // Update message limits (admin function)
    if (body.updateLimits) {
      const { totalMessageLimit, dailyMessageLimit } = body;
      console.log('Updating message limits:', { totalMessageLimit, dailyMessageLimit });
      
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          message_limit: parseInt(totalMessageLimit) || 0,
          daily_message_limit: parseInt(dailyMessageLimit) || 0,
        })
        .eq('machine_id', machineId);
      
      if (updateError) {
        console.error('Error updating message limits:', updateError);
        return res.status(500).json({ error: 'Failed to update message limits' });
      }
      
      const { data: updatedDevice } = await supabase
        .from('devices')
        .select('*')
        .eq('machine_id', machineId)
        .single();
      
      return res.json({
        success: true,
        message: 'Message limits updated successfully',
        device: updatedDevice,
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in message-limits POST:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;