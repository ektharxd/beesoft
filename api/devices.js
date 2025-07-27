// Unified API endpoint for both heartbeat and status
const ADMIN_API_KEY = 'Ekthar@8302';

// Permanent device storage (persists across function calls)
let allDevices = {};

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Handle heartbeat (POST)
    if (req.method === 'POST') {
        const { machineId, version, platform, hostname, whatsappConnected, sessionActive } = req.body;
        
        if (!machineId) {
            return res.status(400).send('machineId is required');
        }

        const now = new Date().toISOString();
        const deviceIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress || 
                        req.socket?.remoteAddress ||
                        'unknown';

        // Store or update device info permanently
        if (!allDevices[machineId]) {
            // New device - store first seen time
            allDevices[machineId] = {
                machineId,
                firstSeen: now,
                totalHeartbeats: 0,
                logs: []
            };
        }

        // Update device info
        const device = allDevices[machineId];
        device.lastSeen = now;
        device.version = version || 'unknown';
        device.platform = platform || 'unknown';
        device.hostname = hostname || machineId;
        device.ip = deviceIP;
        device.whatsappConnected = whatsappConnected || false;
        device.sessionActive = sessionActive || false;
        device.totalHeartbeats = (device.totalHeartbeats || 0) + 1;

        // Add log entry
        const logEntry = {
            timestamp: now,
            type: 'heartbeat',
            ip: deviceIP,
            whatsappConnected: whatsappConnected || false,
            sessionActive: sessionActive || false,
            version: version || 'unknown'
        };

        // Keep last 1000 logs per device to prevent memory issues
        if (!device.logs) device.logs = [];
        device.logs.push(logEntry);
        if (device.logs.length > 1000) {
            device.logs = device.logs.slice(-1000);
        }

        console.log(`Heartbeat from ${machineId} (${hostname}) - IP: ${deviceIP} - Total devices: ${Object.keys(allDevices).length}`);
        
        // Set response headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(200).send('OK');
    }

    // Handle status check (GET)
    if (req.method === 'GET') {
        // Check admin API key
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== ADMIN_API_KEY) {
            return res.status(401).send('Unauthorized');
        }

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        const allDevicesList = [];
        const activeDevices = [];
        const offlineDevices = [];

        // Process all devices (both active and offline)
        for (const [machineId, device] of Object.entries(allDevices)) {
            const deviceData = {
                machineId,
                ...device,
                isOnline: new Date(device.lastSeen) > fiveMinutesAgo,
                logs: device.logs || [] // include logs for history
            };

            allDevicesList.push(deviceData);

            if (deviceData.isOnline) {
                activeDevices.push(deviceData);
            } else {
                offlineDevices.push(deviceData);
            }
        }

        // Sort by last seen (most recent first)
        allDevicesList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
        activeDevices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
        offlineDevices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        // Set response headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.json({ 
            totalDevices: allDevicesList.length,
            activeClientCount: activeDevices.length,
            offlineClientCount: offlineDevices.length,
            clients: allDevicesList, // All devices (active + offline)
            activeClients: activeDevices,
            offlineClients: offlineDevices,
            timestamp: new Date().toISOString()
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}