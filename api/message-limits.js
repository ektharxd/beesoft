// Message limits API - Direct Supabase connection for real-time license data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { machineId } = req.query;
    
    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    console.log(`[MessageLimits] Processing request for device: ${machineId}`);

    // GET: Check message limits and usage
    if (req.method === 'GET') {
      try {
        // Get device directly from Supabase
        const { data: device, error } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();

        if (error || !device) {
          console.log(`[MessageLimits] Device ${machineId} not found in database`);
          return res.json({
            success: true,
            messageStats: {
              type: 'none',
              unlimited: true
            },
            canSendMessages: true,
            reason: 'Device not registered',
            messagesRemaining: -1,
            dailyMessagesRemaining: -1
          });
        }

        console.log(`[MessageLimits] Found device ${machineId}:`, {
          subscriptionType: device.subscription_type,
          subscriptionActive: device.subscription_active,
          isBanned: device.is_banned
        });

        // Check if device is banned
        if (device.is_banned) {
          return res.json({
            success: false,
            messageStats: {
              type: 'banned',
              unlimited: false
            },
            canSendMessages: false,
            reason: 'Device is banned',
            messagesRemaining: 0,
            dailyMessagesRemaining: 0
          });
        }

        // Calculate message stats from actual Supabase data
        const messageStats = calculateMessageStatsFromDevice(device);
        const canSend = checkCanSendMessagesFromDevice(device, 1);

        console.log(`[MessageLimits] Calculated stats for ${machineId}:`, messageStats);
        console.log(`[MessageLimits] Can send check for ${machineId}:`, canSend);

        return res.json({
          success: true,
          messageStats,
          canSendMessages: canSend.allowed,
          reason: canSend.reason,
          messagesRemaining: canSend.messagesRemaining,
          dailyMessagesRemaining: canSend.dailyMessagesRemaining
        });

      } catch (error) {
        console.error('[MessageLimits] Error fetching device from Supabase:', error);
        return res.status(500).json({ 
          error: 'Database error',
          details: error.message 
        });
      }
    }

    // POST: Check if can send specific number of messages
    if (req.method === 'POST' && (req.url.includes('/check') || req.originalUrl.includes('/check'))) {
      const { messageCount = 1 } = req.body;
      
      try {
        const { data: device, error } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();

        if (error || !device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        const canSend = checkCanSendMessagesFromDevice(device, messageCount);
        const messageStats = calculateMessageStatsFromDevice(device);

        return res.json({
          success: true,
          allowed: canSend.allowed,
          reason: canSend.reason,
          messageCount,
          messagesRemaining: canSend.messagesRemaining,
          dailyMessagesRemaining: canSend.dailyMessagesRemaining,
          messageStats
        });

      } catch (error) {
        console.error('[MessageLimits] Error checking message limits:', error);
        return res.status(500).json({ error: 'Database error' });
      }
    }

    // POST: Track message usage
    if (req.method === 'POST' && (req.url.includes('/track') || req.originalUrl.includes('/track'))) {
      const { messageCount = 1, campaignId, contactCount } = req.body;
      
      try {
        const { data: device, error } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();

        if (error || !device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        // Only track for trial subscriptions
        if (device.subscription_type === 'trial' && device.subscription_active) {
          // Reset daily counter if needed
          const now = new Date();
          const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
          let dailyUsed = device.daily_messages_used || 0;
          
          if (now.toDateString() !== lastReset.toDateString()) {
            dailyUsed = 0;
          }

          // Update message usage
          const newTotalUsed = (device.messages_used || 0) + messageCount;
          const newDailyUsed = dailyUsed + messageCount;

          const { error: updateError } = await supabase
            .from('devices')
            .update({
              messages_used: newTotalUsed,
              daily_messages_used: newDailyUsed,
              last_daily_reset: now.toISOString()
            })
            .eq('machine_id', machineId);

          if (updateError) {
            console.error('[MessageLimits] Error updating message usage:', updateError);
            throw updateError;
          }

          // Get updated device data
          const { data: updatedDevice } = await supabase
            .from('devices')
            .select('*')
            .eq('machine_id', machineId)
            .single();

          const messageStats = calculateMessageStatsFromDevice(updatedDevice);

          console.log(`[MessageLimits] Tracked ${messageCount} messages for ${machineId}. New stats:`, messageStats);

          return res.json({
            success: true,
            message: `Tracked ${messageCount} messages`,
            messageStats
          });
        } else {
          // For permanent or inactive subscriptions, just return current stats
          const messageStats = calculateMessageStatsFromDevice(device);
          return res.json({
            success: true,
            message: 'No tracking needed for this subscription type',
            messageStats
          });
        }

      } catch (error) {
        console.error('[MessageLimits] Error tracking message usage:', error);
        return res.status(500).json({ error: 'Failed to track message usage' });
      }
    }
    
    // POST: Update message limits (admin function)
    if (req.method === 'POST' && (req.url.includes('/update-limits') || req.originalUrl.includes('/update-limits'))) {
      const { totalMessageLimit, dailyMessageLimit } = req.body;
      
      try {
        const { data: device, error } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();

        if (error || !device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        if (device.subscription_type !== 'trial') {
          return res.status(400).json({ error: 'Message limits can only be set for trial subscriptions' });
        }

        // Update message limits
        const { error: updateError } = await supabase
          .from('devices')
          .update({
            message_limit: parseInt(totalMessageLimit) || 0,
            daily_message_limit: parseInt(dailyMessageLimit) || 0
          })
          .eq('machine_id', machineId);

        if (updateError) {
          console.error('[MessageLimits] Error updating message limits:', updateError);
          throw updateError;
        }

        const { data: updatedDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('machine_id', machineId)
          .single();

        return res.json({
          success: true,
          message: 'Message limits updated successfully',
          device: updatedDevice
        });

      } catch (error) {
        console.error('[MessageLimits] Error updating message limits:', error);
        return res.status(500).json({ error: 'Failed to update message limits' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[MessageLimits] API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Helper functions for Supabase device data
function calculateMessageStatsFromDevice(device) {
  console.log('[MessageLimits] Calculating stats for device:', {
    hasSubscription: !!device.subscription_type,
    subscriptionType: device.subscription_type,
    subscriptionActive: device.subscription_active
  });

  if (!device.subscription_type || device.subscription_type !== 'trial' || !device.subscription_active) {
    return {
      type: device.subscription_type || 'none',
      unlimited: true,
      subscriptionActive: device.subscription_active || false,
      subscriptionType: device.subscription_type || 'none'
    };
  }

  // Reset daily counter if needed
  const now = new Date();
  const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
  let dailyUsed = device.daily_messages_used || 0;
  
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }

  const stats = {
    type: 'trial',
    unlimited: false,
    subscriptionActive: true,
    subscriptionType: 'trial',
    totalLimit: device.message_limit || 0,
    totalUsed: device.messages_used || 0,
    totalRemaining: Math.max(0, (device.message_limit || 0) - (device.messages_used || 0)),
    dailyLimit: device.daily_message_limit || 0,
    dailyUsed: dailyUsed,
    dailyRemaining: Math.max(0, (device.daily_message_limit || 0) - dailyUsed),
    lastDailyReset: device.last_daily_reset,
    // Additional subscription info
    subscriptionStart: device.subscription_activated_at,
    subscriptionExpires: device.subscription_expires_at,
    subscriptionKey: device.license_key
  };

  console.log('[MessageLimits] Calculated trial stats:', stats);
  return stats;
}

function checkCanSendMessagesFromDevice(device, messageCount = 1) {
  if (!device.subscription_type || !device.subscription_active) {
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
    const now = new Date();
    const expiryDate = new Date(device.subscription_expires_at);
    if (now > expiryDate) {
      return { allowed: false, reason: 'Trial subscription has expired' };
    }
  }

  // Reset daily counter if needed
  const now = new Date();
  const lastReset = device.last_daily_reset ? new Date(device.last_daily_reset) : now;
  let dailyUsed = device.daily_messages_used || 0;
  
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }

  // Check total message limit
  if (device.message_limit > 0 && 
      ((device.messages_used || 0) + messageCount) > device.message_limit) {
    return { 
      allowed: false, 
      reason: 'Total message limit exceeded',
      messagesRemaining: Math.max(0, device.message_limit - (device.messages_used || 0)),
      dailyMessagesRemaining: Math.max(0, (device.daily_message_limit || 0) - dailyUsed)
    };
  }

  // Check daily message limit
  if (device.daily_message_limit > 0 && 
      (dailyUsed + messageCount) > device.daily_message_limit) {
    return { 
      allowed: false, 
      reason: 'Daily message limit exceeded',
      messagesRemaining: device.message_limit > 0 ? 
        Math.max(0, device.message_limit - (device.messages_used || 0)) : -1,
      dailyMessagesRemaining: Math.max(0, device.daily_message_limit - dailyUsed)
    };
  }

  return { 
    allowed: true,
    messagesRemaining: device.message_limit > 0 ? 
      device.message_limit - (device.messages_used || 0) : -1,
    dailyMessagesRemaining: device.daily_message_limit > 0 ? 
      device.daily_message_limit - dailyUsed : -1
  };
}