// Message tracking endpoint - handles POST requests to track message usage
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { machineId, messageCount = 1 } = req.body;
    
    if (!machineId) {
      return res.status(400).json({ error: 'Machine ID is required' });
    }

    console.log(`[MessageTrack] Tracking ${messageCount} messages for device: ${machineId}`);

    // Get device from database
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('machine_id', machineId)
      .single();

    if (error || !device) {
      console.log(`[MessageTrack] Device ${machineId} not found in database`);
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
        console.error('[MessageTrack] Error updating message usage:', updateError);
        throw updateError;
      }

      console.log(`[MessageTrack] Successfully tracked ${messageCount} messages for ${machineId}. Total: ${newTotalUsed}, Daily: ${newDailyUsed}`);

      return res.json({
        success: true,
        message: `Tracked ${messageCount} messages`,
        totalUsed: newTotalUsed,
        dailyUsed: newDailyUsed
      });
    } else {
      // For permanent or inactive subscriptions, just return success
      return res.json({
        success: true,
        message: 'No tracking needed for this subscription type'
      });
    }

  } catch (error) {
    console.error('[MessageTrack] API error:', error);
    return res.status(500).json({ 
      error: 'Failed to track message usage',
      details: error.message 
    });
  }
};
