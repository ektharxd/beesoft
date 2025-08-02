const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId, type, days, key } = req.body;
    if (!machineId || !type) {
        return res.status(400).json({ error: 'machineId and type are required' });
    }

    try {
        // Check if device exists
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('machine_id', machineId)
            .single();

        if (deviceError || !device) {
            console.log(`Device not found: ${machineId}`, deviceError);
            return res.status(404).json({ error: 'Device not found. Please register the device first.' });
        }

        // Handle permanent activation
        if (type === 'subscription' || type === 'permanent') {
            if (!key) {
                return res.status(400).json({ error: 'Permanent activation key is required' });
            }

            // Enforce key format: ABCD-1234-EFGH-5678
            const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
            if (!keyPattern.test(key)) {
                return res.status(400).json({ error: 'Invalid key format. Use format: ABCD-1234-EFGH-5678' });
            }

            // Check if the key exists and is valid
            const { data: licenseKey, error: keyError } = await supabase
                .from('license_keys')
                .select('*')
                .eq('key', key)
                .single();

            if (keyError || !licenseKey) {
                return res.status(400).json({ error: 'Invalid activation key' });
            }

            // Check if key is already used
            if (licenseKey.used && licenseKey.assigned_to !== machineId) {
                return res.status(400).json({ 
                    error: 'Activation key already used',
                    message: `This key has already been used by another device`
                });
            }

            // Check if key is expired
            if (licenseKey.expires_at && new Date() > new Date(licenseKey.expires_at)) {
                return res.status(400).json({ error: 'Activation key has expired' });
            }

            // Check if key is active
            if (!licenseKey.is_active) {
                return res.status(400).json({ error: 'Activation key has been deactivated' });
            }

            // Mark the key as used
            const { error: keyUpdateError } = await supabase
                .from('license_keys')
                .update({
                    used: true,
                    assigned_to: machineId,
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

            // Update device with permanent subscription
            const { data: updatedDevice, error: updateError } = await supabase
                .from('devices')
                .update({
                    subscription_type: 'permanent',
                    subscription_active: true,
                    subscription_expires_at: null,
                    subscription_activated_by: 'admin',
                    subscription_activated_at: new Date().toISOString(),
                    license_key: key
                })
                .eq('machine_id', machineId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating device:', updateError);
                return res.status(500).json({ error: 'Failed to activate permanent subscription' });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Device permanently activated successfully',
                subscription: {
                    type: 'permanent',
                    activatedAt: new Date().toISOString(),
                    key: key
                },
                device: updatedDevice
            });
        }

        // Handle trial activation
        if (type === 'trial') {
            if (typeof days !== 'number' || days < 1 || days > 365) {
                return res.status(400).json({ error: 'Days must be a number between 1 and 365' });
            }

            const expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString();

            const { data: updatedDevice, error: updateError } = await supabase
                .from('devices')
                .update({
                    subscription_type: 'trial',
                    subscription_active: true,
                    subscription_expires_at: expiresAt,
                    subscription_activated_by: 'admin',
                    subscription_activated_at: new Date().toISOString()
                })
                .eq('machine_id', machineId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating device:', updateError);
                return res.status(500).json({ error: 'Failed to activate trial subscription' });
            }

            return res.status(200).json({ 
                success: true, 
                message: `Trial activated for ${days} days`,
                subscription: {
                    type: 'trial',
                    days: days,
                    activatedAt: new Date().toISOString(),
                    expiresAt: expiresAt
                },
                device: updatedDevice
            });
        }

        return res.status(400).json({ error: 'Invalid subscription type. Use "trial" or "permanent"' });

    } catch (error) {
        console.error('Error in assign-subscription:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};