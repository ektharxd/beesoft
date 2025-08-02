const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId } = req.query;
    if (!machineId) {
        return res.status(400).json({ error: 'machineId is required' });
    }

    try {
        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('machine_id', machineId)
            .single();

        if (error || !device) {
            console.log(`Device not found: ${machineId}`, error);
            return res.status(404).json({ error: 'Device not found' });
        }

        // Calculate if device is online (last seen within 2 minutes)
        const isOnline = device.last_seen && new Date(device.last_seen) > new Date(Date.now() - 2 * 60 * 1000);
        
        // Calculate days remaining for trial subscriptions
        let daysRemaining = 0;
        if (device.subscription_type === 'trial' && device.subscription_expires_at) {
            const expiryDate = new Date(device.subscription_expires_at);
            const now = new Date();
            const diffTime = expiryDate - now;
            daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else if (device.subscription_type === 'permanent') {
            daysRemaining = 9999; // Permanent license
        }

        // Determine subscription status
        let subscriptionStatus = 'inactive';
        if (device.is_banned) {
            subscriptionStatus = 'banned';
        } else if (device.subscription_type === 'permanent' && device.subscription_active) {
            subscriptionStatus = 'permanent';
        } else if (device.subscription_type === 'trial' && device.subscription_active) {
            if (device.subscription_expires_at) {
                const now = new Date();
                const expiryDate = new Date(device.subscription_expires_at);
                if (expiryDate > now) {
                    subscriptionStatus = 'active';
                } else {
                    subscriptionStatus = 'expired';
                }
            } else {
                subscriptionStatus = 'active';
            }
        }

        // Return device status in the expected format
        return res.status(200).json({
            success: true,
            machineId: device.machine_id,
            username: device.username,
            customerName: device.name || null,
            email: device.email || null,
            phone: device.mobile || null,
            subscription: {
                type: device.subscription_type || 'trial',
                active: device.subscription_active || false,
                expires: device.subscription_expires_at,
                key: device.license_key,
                status: subscriptionStatus,
                daysRemaining: daysRemaining
            },
            lastSeen: device.last_seen,
            whatsappConnected: device.whatsapp_connected || false,
            sessionActive: device.session_active || false,
            version: device.version || 'unknown',
            platform: device.platform || 'unknown',
            hostname: device.hostname || 'unknown',
            ip: device.ip || 'unknown',
            createdAt: device.created_at || null,
            isBanned: device.is_banned || false,
            isOnline: isOnline
        });
    } catch (error) {
        console.error('Error fetching device status:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};