const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/device-status/:machineId - Get device status
router.get('/:machineId', async (req, res) => {
    try {
        const { machineId } = req.params;
        
        if (!machineId) {
            return res.status(400).json({ error: 'machineId is required' });
        }

        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('machine_id', machineId)
            .single();

        if (error || !device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Return device status information
        return res.status(200).json({
            success: true,
            machineId: device.machine_id,
            username: device.username,
            customerName: device.name || null,
            email: device.email || null,
            phone: device.mobile || null,
            subscription: {
                type: device.subscription_type,
                active: device.subscription_active,
                expires: device.subscription_expires_at,
                key: device.license_key
            },
            lastSeen: device.last_seen,
            whatsappConnected: device.whatsapp_connected || false,
            sessionActive: device.session_active || false,
            version: device.version || 'unknown',
            platform: device.platform || 'unknown',
            hostname: device.hostname || 'unknown',
            ip: device.ip || 'unknown',
            createdAt: device.created_at || null,
            isBanned: device.is_banned || false
        });
    } catch (error) {
        console.error('Error fetching device status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;