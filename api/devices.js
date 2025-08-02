const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_API_KEY = 'Ekthar@8302';

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Device registration (POST /api/devices?register=1)
        if (req.method === 'POST' && req.query.register === '1') {
            const { machineId, username, name, email, phone, platform, osVersion, osBuild, userAgent, hostname } = req.body;
            if (!machineId || !username) {
                return res.status(400).json({ error: 'machineId and username are required' });
            }

            // Check if device already exists
            const { data: existingDevice, error: checkError } = await supabase
                .from('devices')
                .select('*')
                .eq('machine_id', machineId)
                .single();

            if (existingDevice && !checkError) {
                return res.status(409).json({ 
                    error: 'Device already registered', 
                    message: `Device ${machineId} is already registered with username: ${existingDevice.username}`,
                    device: {
                        machineId: existingDevice.machine_id,
                        username: existingDevice.username,
                        customerName: existingDevice.name || null,
                        registeredAt: existingDevice.created_at
                    }
                });
            }

            // Register new device
            const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
            const now = new Date().toISOString();

            const newDevice = {
                machine_id: machineId,
                username,
                name: name || null,
                email: email || null,
                mobile: phone || null,
                subscription_type: 'trial',
                subscription_active: false,
                created_at: now,
                last_seen: now,
                version: osVersion || 'unknown',
                os_build: osBuild || 'unknown',
                platform: platform || 'unknown',
                hostname: hostname || machineId,
                ip: deviceIP,
                user_agent: userAgent || '',
                whatsapp_connected: false,
                session_active: false,
                is_banned: false
            };

            const { data: insertedDevice, error: insertError } = await supabase
                .from('devices')
                .insert(newDevice)
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting device:', insertError);
                return res.status(500).json({ error: 'Failed to register device' });
            }

            return res.status(200).json({ 
                success: true, 
                message: `Device ${machineId} registered successfully`,
                device: {
                    machineId: insertedDevice.machine_id,
                    username: insertedDevice.username,
                    customerName: insertedDevice.name || null,
                    registeredAt: insertedDevice.created_at
                }
            });
        }

        // Handle heartbeat (POST)
        if (req.method === 'POST') {
            const { machineId, version, platform, hostname, whatsappConnected, sessionActive, customerName, osVersion, osBuild, userAgent } = req.body;
            if (!machineId) {
                return res.status(400).send('machineId is required');
            }

            const now = new Date().toISOString();
            const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';

            // Check if device exists
            const { data: existingDevice } = await supabase
                .from('devices')
                .select('*')
                .eq('machine_id', machineId)
                .single();

            if (existingDevice) {
                // Update existing device
                const updateData = {
                    version: version || osVersion || 'unknown',
                    os_build: osBuild || 'unknown',
                    platform: platform || 'unknown',
                    hostname: hostname || machineId,
                    ip: deviceIP,
                    user_agent: userAgent || '',
                    whatsapp_connected: whatsappConnected || false,
                    session_active: sessionActive || false,
                    last_seen: now
                };

                if (customerName) {
                    updateData.name = customerName;
                }

                await supabase
                    .from('devices')
                    .update(updateData)
                    .eq('machine_id', machineId);
            } else {
                // Create new device if it doesn't exist
                const newDevice = {
                    machine_id: machineId,
                    username: 'unknown',
                    name: customerName || null,
                    subscription_type: 'trial',
                    subscription_active: false,
                    created_at: now,
                    last_seen: now,
                    version: version || osVersion || 'unknown',
                    os_build: osBuild || 'unknown',
                    platform: platform || 'unknown',
                    hostname: hostname || machineId,
                    ip: deviceIP,
                    user_agent: userAgent || '',
                    whatsapp_connected: whatsappConnected || false,
                    session_active: sessionActive || false,
                    is_banned: false
                };

                await supabase
                    .from('devices')
                    .insert(newDevice);
            }

            return res.status(200).send('OK');
        }

        // Handle device removal (DELETE /api/devices?remove=1&machineId=xxx)
        if (req.method === 'DELETE' && req.query.remove === '1') {
            const { machineId } = req.query;
            if (!machineId) {
                return res.status(400).json({ error: 'machineId is required' });
            }
            
            const { error } = await supabase
                .from('devices')
                .delete()
                .eq('machine_id', machineId);

            if (error) {
                console.error('Error deleting device:', error);
                return res.status(500).json({ error: 'Failed to remove device' });
            }

            return res.status(200).json({ 
                success: true, 
                message: `Device ${machineId} removed successfully` 
            });
        }

        // Handle status check (GET)
        if (req.method === 'GET') {
            // Check admin API key
            const apiKey = req.headers['x-api-key'];
            if (!apiKey || apiKey !== ADMIN_API_KEY) {
                return res.status(401).send('Unauthorized');
            }

            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

            const { data: allDevices, error } = await supabase
                .from('devices')
                .select('*')
                .order('last_seen', { ascending: false });

            if (error) {
                console.error('Error fetching devices:', error);
                return res.status(500).json({ error: 'Failed to fetch devices' });
            }

            const allDevicesList = [];
            const activeDevices = [];
            const offlineDevices = [];

            for (const device of allDevices || []) {
                const isOnline = new Date(device.last_seen) > oneMinuteAgo;
                const deviceData = {
                    ...device,
                    machineId: device.machine_id,
                    lastSeen: device.last_seen,
                    customerName: device.name,
                    whatsappConnected: device.whatsapp_connected,
                    sessionActive: device.session_active,
                    createdAt: device.created_at,
                    subscription: {
                        type: device.subscription_type,
                        active: device.subscription_active,
                        expires: device.subscription_expires_at
                    },
                    isOnline
                };

                allDevicesList.push(deviceData);
                if (isOnline) {
                    activeDevices.push(deviceData);
                } else {
                    offlineDevices.push(deviceData);
                }
            }

            return res.json({
                totalDevices: allDevicesList.length,
                activeClientCount: activeDevices.length,
                offlineClientCount: offlineDevices.length,
                clients: allDevicesList,
                activeClients: activeDevices,
                offlineClients: offlineDevices,
                timestamp: new Date().toISOString()
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};