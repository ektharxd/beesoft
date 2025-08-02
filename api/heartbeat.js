// Simple in-memory storage that persists during the function lifecycle
let devices = {};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId, version, platform, hostname } = req.body;
    if (!machineId) {
        return res.status(400).send('machineId is required');
    }

    // Store device info in memory
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
    
    // Validate required fields before sending response
    if (!devices[machineId].name || !devices[machineId].mobile) {
        return res.status(400).json({ error: 'Device is missing required fields: name and/or mobile', machineId });
    }
    
    res.status(200).send('OK');
}