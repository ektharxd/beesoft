// Message limits API - proxy to admin dashboard backend
const fetch = require('node-fetch');
const ADMIN_API_BASE = 'http://localhost:4000/api/admin';

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

    // GET: Check message limits and usage
    if (req.method === 'GET') {
      try {
        // Try to get device info from admin API
        const deviceResponse = await fetch(`http://localhost:4000/api/admin/devices/${machineId}`, {
          headers: {
            'Authorization': 'Bearer admin_internal_token'
          },
          timeout: 5000 // 5 second timeout
        });

        if (!deviceResponse.ok) {
          if (deviceResponse.status === 404) {
            // Device not found, return unlimited access for now
            return res.json({
              success: true,
              messageStats: {
                type: 'none',
                unlimited: true
              },
              canSendMessages: true,
              reason: null,
              messagesRemaining: -1,
              dailyMessagesRemaining: -1
            });
          }
          throw new Error('Failed to fetch device');
        }

        const device = await deviceResponse.json();
        
        // Calculate message stats
        const messageStats = calculateMessageStats(device);
        const canSend = checkCanSendMessages(device, 1);

        return res.json({
          success: true,
          messageStats,
          canSendMessages: canSend.allowed,
          reason: canSend.reason,
          messagesRemaining: canSend.messagesRemaining,
          dailyMessagesRemaining: canSend.dailyMessagesRemaining
        });

      } catch (error) {
        console.error('Error fetching device:', error);
        // If admin API is not available, simulate trial limits for testing
        const simulatedStats = {
          type: 'trial',
          unlimited: false,
          totalLimit: 100,
          totalUsed: 85, // Simulate 85 messages used
          totalRemaining: 15,
          dailyLimit: 50,
          dailyUsed: 45, // Simulate 45 daily messages used
          dailyRemaining: 5
        };
        
        return res.json({
          success: true,
          messageStats: simulatedStats,
          canSendMessages: true,
          reason: null,
          messagesRemaining: simulatedStats.totalRemaining,
          dailyMessagesRemaining: simulatedStats.dailyRemaining
        });
      }
    }

    // POST: Check if can send specific number of messages
    if (req.method === 'POST' && (req.url.includes('/check') || req.originalUrl.includes('/check'))) {
      const { messageCount = 1 } = req.body;
      
      try {
        const deviceResponse = await fetch(`http://localhost:4000/api/admin/devices/${machineId}`, {
          headers: {
            'Authorization': 'Bearer admin_internal_token'
          }
        });

        if (!deviceResponse.ok) {
          return res.status(404).json({ error: 'Device not found' });
        }

        const device = await deviceResponse.json();
        const canSend = checkCanSendMessages(device, messageCount);
        const messageStats = calculateMessageStats(device);

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
        console.error('Error checking message limits:', error);
        // If admin API is not available, simulate trial limits for testing
        const simulatedStats = {
          type: 'trial',
          unlimited: false,
          totalLimit: 100,
          totalUsed: 85, // Simulate 85 messages used
          totalRemaining: 15,
          dailyLimit: 50,
          dailyUsed: 45, // Simulate 45 daily messages used
          dailyRemaining: 5
        };
        
        // Check if the requested message count would exceed limits
        const wouldExceedTotal = messageCount > simulatedStats.totalRemaining;
        const wouldExceedDaily = messageCount > simulatedStats.dailyRemaining;
        
        if (wouldExceedTotal) {
          return res.json({
            success: true,
            allowed: false,
            reason: 'Total message limit exceeded',
            messageCount,
            messagesRemaining: simulatedStats.totalRemaining,
            dailyMessagesRemaining: simulatedStats.dailyRemaining,
            messageStats: simulatedStats
          });
        }
        
        if (wouldExceedDaily) {
          return res.json({
            success: true,
            allowed: false,
            reason: 'Daily message limit exceeded',
            messageCount,
            messagesRemaining: simulatedStats.totalRemaining,
            dailyMessagesRemaining: simulatedStats.dailyRemaining,
            messageStats: simulatedStats
          });
        }
        
        return res.json({
          success: true,
          allowed: true,
          reason: null,
          messageCount,
          messagesRemaining: simulatedStats.totalRemaining,
          dailyMessagesRemaining: simulatedStats.dailyRemaining,
          messageStats: simulatedStats
        });
      }
    }

    // POST: Track message usage
    if (req.method === 'POST' && (req.url.includes('/track') || req.originalUrl.includes('/track'))) {
      const { messageCount = 1, campaignId, contactCount } = req.body;
      
      try {
        // For now, return success without actually tracking
        // This would need to be implemented in the admin dashboard backend
        return res.json({
          success: true,
          message: `Would track ${messageCount} messages`,
          messageStats: {
            type: 'trial',
            unlimited: false,
            totalLimit: 100,
            totalUsed: 0,
            totalRemaining: 100,
            dailyLimit: 50,
            dailyUsed: 0,
            dailyRemaining: 50
          }
        });

      } catch (error) {
        console.error('Error tracking message usage:', error);
        return res.status(500).json({ error: 'Failed to track message usage' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Message limits API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Helper functions
function calculateMessageStats(device) {
  if (!device.subscription || device.subscription.type !== 'trial') {
    return {
      type: device.subscription?.type || 'none',
      unlimited: true
    };
  }

  const subscription = device.subscription;
  
  // Reset daily counter if needed
  const now = new Date();
  const lastReset = new Date(subscription.lastDailyReset || now);
  let dailyUsed = subscription.dailyMessagesUsed || 0;
  
  if (now.toDateString() !== lastReset.toDateString()) {
    dailyUsed = 0;
  }

  return {
    type: 'trial',
    unlimited: false,
    totalLimit: subscription.messageLimit || 0,
    totalUsed: subscription.messagesUsed || 0,
    totalRemaining: Math.max(0, (subscription.messageLimit || 0) - (subscription.messagesUsed || 0)),
    dailyLimit: subscription.dailyMessageLimit || 0,
    dailyUsed: dailyUsed,
    dailyRemaining: Math.max(0, (subscription.dailyMessageLimit || 0) - dailyUsed),
    lastDailyReset: subscription.lastDailyReset
  };
}

function checkCanSendMessages(device, messageCount = 1) {
  if (!device.subscription || !device.subscription.active) {
    return { allowed: false, reason: 'No active subscription' };
  }
  
  if (device.subscription.type === 'permanent') {
    return { allowed: true };
  }
  
  if (device.subscription.type !== 'trial') {
    return { allowed: false, reason: 'Invalid subscription type' };
  }

  const subscription = device.subscription;
  
  // Reset daily counter if needed
  const now = new Date();
  const lastReset = new Date(subscription.lastDailyReset || now);
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
      messagesRemaining: Math.max(0, subscription.messageLimit - (subscription.messagesUsed || 0))
    };
  }

  // Check daily message limit
  if (subscription.dailyMessageLimit > 0 && 
      (dailyUsed + messageCount) > subscription.dailyMessageLimit) {
    return { 
      allowed: false, 
      reason: 'Daily message limit exceeded',
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