// Unified API endpoint for both heartbeat and status
const ADMIN_API_KEY = 'Ekthar@8302';

// In-memory storage (will reset on cold starts, but that's okay for demo)
let devices = {};

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
        const { machineId, version, platform, hostname } = req.body;
        
        if (!machineId) {
            return res.status(400).send('machineId is required');
        }

        // Store device info
        devices[machineId] = {
            lastSeen: new Date().toISOString(),
            version: version || 'unknown',
            platform: platform || 'unknown',
            hostname: hostname || machineId,
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
        };

        console.log(`Heartbeat from ${machineId} (${hostname}) - Total devices: ${Object.keys(devices).length}`);
        
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

        const activeClients = [];
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Filter active devices (last seen within 5 minutes)
        for (const [machineId, data] of Object.entries(devices)) {
            if (new Date(data.lastSeen) > fiveMinutesAgo) {
                activeClients.push({ machineId, ...data });
            }
        }

        // Set response headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.json({ 
            activeClientCount: activeClients.length, 
            clients: activeClients,
            totalDevices: Object.keys(devices).length,
            timestamp: new Date().toISOString()
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}