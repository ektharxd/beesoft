import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data: devices, error } = await supabase
            .from('devices')
            .select('*');

        if (error) {
            console.error('Error fetching devices:', error);
            return res.status(500).json({ error: 'Failed to fetch devices' });
        }

        // Only show key fields for debug
        const debugList = (devices || []).map(device => ({
            machineId: device.machine_id,
            username: device.username,
            subscription: {
                type: device.subscription_type,
                active: device.subscription_active,
                expires: device.subscription_expires_at
            },
            lastSeen: device.last_seen,
            createdAt: device.created_at,
            id: device.id
        }));

        return res.status(200).json({
            count: debugList.length,
            devices: debugList
        });
    } catch (error) {
        console.error('Error in devices-debug:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}