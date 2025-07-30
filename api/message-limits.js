// Message limits API - Direct MongoDB connection for real-time license data
const { MongoClient } = require('mongodb');

// MongoDB connection - use environment variable
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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

    // Connect to MongoDB
    await client.connect();
    const db = client.db('beesoft');
    const devices = db.collection('devices');

    // GET: Check message limits and usage
    if (req.method === 'GET') {
      try {
        // Get device directly from MongoDB
        const device = await devices.findOne({ machineId });

        if (!device) {
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
          subscription: device.subscription,
          isBanned: device.isBanned
        });

        // Check if device is banned
        if (device.isBanned) {
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

        // Calculate message stats from actual MongoDB data
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
        console.error('[MessageLimits] Error fetching device from MongoDB:', error);
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
        const device = await devices.findOne({ machineId });

        if (!device) {
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
        const device = await devices.findOne({ machineId });

        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        // Only track for trial subscriptions
        if (device.subscription && device.subscription.type === 'trial' && device.subscription.active) {
          // Reset daily counter if needed
          const now = new Date();
          const lastReset = device.subscription.lastDailyReset ? new Date(device.subscription.lastDailyReset) : now;
          let dailyUsed = device.subscription.dailyMessagesUsed || 0;
          
          if (now.toDateString() !== lastReset.toDateString()) {
            dailyUsed = 0;
          }

          // Update message usage
          const newTotalUsed = (device.subscription.messagesUsed || 0) + messageCount;
          const newDailyUsed = dailyUsed + messageCount;

          await devices.updateOne(
            { machineId },
            {
              $set: {
                'subscription.messagesUsed': newTotalUsed,
                'subscription.dailyMessagesUsed': newDailyUsed,
                'subscription.lastDailyReset': now
              },
              $push: {
                logs: {
                  timestamp: now,
                  type: 'message_usage',
                  details: {
                    messageCount,
                    totalUsed: newTotalUsed,
                    dailyUsed: newDailyUsed,
                    totalLimit: device.subscription.messageLimit,
                    dailyLimit: device.subscription.dailyMessageLimit,
                    campaignId,
                    contactCount
                  }
                }
              }
            }
          );

          // Get updated device data
          const updatedDevice = await devices.findOne({ machineId });
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
        const device = await devices.findOne({ machineId });

        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }

        if (!device.subscription || device.subscription.type !== 'trial') {
          return res.status(400).json({ error: 'Message limits can only be set for trial subscriptions' });
        }

        // Update message limits
        await devices.updateOne(
          { machineId },
          {
            $set: {
              'subscription.messageLimit': parseInt(totalMessageLimit) || 0,
              'subscription.dailyMessageLimit': parseInt(dailyMessageLimit) || 0
            },
            $push: {
              logs: {
                timestamp: new Date(),
                type: 'message_limits_update',
                details: {
                  totalMessageLimit: parseInt(totalMessageLimit) || 0,
                  dailyMessageLimit: parseInt(dailyMessageLimit) || 0
                }
              }
            }
          }
        );

        const updatedDevice = await devices.findOne({ machineId });

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
  } finally {
    // Close MongoDB connection
    try {
      await client.close();
    } catch (closeError) {
      console.error('[MessageLimits] Error closing MongoDB connection:', closeError);
    }
  }
};

// Helper functions for MongoDB device data
function calculateMessageStatsFromDevice(device) {
  console.log('[MessageLimits] Calculating stats for device:', {
    hasSubscription: !!device.subscription,
    subscriptionType: device.subscription?.type,
    subscriptionActive: device.subscription?.active
  });

  if (!device.subscription || device.subscription.type !== 'trial' || !device.subscription.active) {
    return {
      type: device.subscription?.type || 'none',
      unlimited: true,
      subscriptionActive: device.subscription?.active || false,
      subscriptionType: device.subscription?.type || 'none'
    };
  }

  const subscription = device.subscription;
  
  // Reset daily counter if needed
  const now = new Date();
  const lastReset = subscription.lastDailyReset ? new Date(subscription.lastDailyReset) : now;
  let dailyUsed = subscription.dailyMessagesUsed || 0;
  
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }

  const stats = {
    type: 'trial',
    unlimited: false,
    subscriptionActive: true,
    subscriptionType: 'trial',
    totalLimit: subscription.messageLimit || 0,
    totalUsed: subscription.messagesUsed || 0,
    totalRemaining: Math.max(0, (subscription.messageLimit || 0) - (subscription.messagesUsed || 0)),
    dailyLimit: subscription.dailyMessageLimit || 0,
    dailyUsed: dailyUsed,
    dailyRemaining: Math.max(0, (subscription.dailyMessageLimit || 0) - dailyUsed),
    lastDailyReset: subscription.lastDailyReset,
    // Additional subscription info
    subscriptionStart: subscription.start,
    subscriptionDays: subscription.days,
    subscriptionKey: subscription.key
  };

  console.log('[MessageLimits] Calculated trial stats:', stats);
  return stats;
}

function checkCanSendMessagesFromDevice(device, messageCount = 1) {
  if (!device.subscription || !device.subscription.active) {
    return { allowed: false, reason: 'No active subscription' };
  }
  
  if (device.isBanned) {
    return { allowed: false, reason: 'Device is banned' };
  }
  
  if (device.subscription.type === 'permanent') {
    return { allowed: true, messagesRemaining: -1, dailyMessagesRemaining: -1 };
  }
  
  if (device.subscription.type !== 'trial') {
    return { allowed: false, reason: 'Invalid subscription type' };
  }

  // Check if trial has expired
  if (device.subscription.start && device.subscription.days) {
    const now = new Date();
    const expiryDate = new Date(device.subscription.start.getTime() + (device.subscription.days * 24 * 60 * 60 * 1000));
    if (now > expiryDate) {
      return { allowed: false, reason: 'Trial subscription has expired' };
    }
  }

  const subscription = device.subscription;
  
  // Reset daily counter if needed
  const now = new Date();
  const lastReset = subscription.lastDailyReset ? new Date(subscription.lastDailyReset) : now;
  let dailyUsed = subscription.dailyMessagesUsed || 0;
  
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }

  // Check total message limit
  if (subscription.messageLimit > 0 && 
      ((subscription.messagesUsed || 0) + messageCount) > subscription.messageLimit) {
    return { 
      allowed: false, 
      reason: 'Total message limit exceeded',
      messagesRemaining: Math.max(0, subscription.messageLimit - (subscription.messagesUsed || 0)),
      dailyMessagesRemaining: Math.max(0, (subscription.dailyMessageLimit || 0) - dailyUsed)
    };
  }

  // Check daily message limit
  if (subscription.dailyMessageLimit > 0 && 
      (dailyUsed + messageCount) > subscription.dailyMessageLimit) {
    return { 
      allowed: false, 
      reason: 'Daily message limit exceeded',
      messagesRemaining: subscription.messageLimit > 0 ? 
        Math.max(0, subscription.messageLimit - (subscription.messagesUsed || 0)) : -1,
      dailyMessagesRemaining: Math.max(0, subscription.dailyMessageLimit - dailyUsed)
    };
  }

  return { 
    allowed: true,
    messagesRemaining: subscription.messageLimit > 0 ? 
      subscription.messageLimit - (subscription.messagesUsed || 0) : -1,
    dailyMessagesRemaining: subscription.dailyMessageLimit > 0 ? 
      subscription.dailyMessageLimit - dailyUsed : -1
  };
}