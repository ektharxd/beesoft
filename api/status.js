// Import the same devices object from heartbeat
// Note: This won't work across separate serverless functions
// Let's use a different approach - check Vercel KV or create a single endpoint

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check admin API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Since we can't share memory between serverless functions,
        // let's fetch from the heartbeat endpoint to get recent data
        const heartbeatResponse = await fetch(`${req.headers.origin || 'https://34.10.132.60:3001'}/api/heartbeat`, {
            method: 'GET',
            headers: {
                'x-admin-request': 'true'
            }
        });

        let devices = {};
        if (heartbeatResponse.ok) {
            try {
                devices = await heartbeatResponse.json();
            } catch (e) {
                // If heartbeat endpoint doesn't support GET, return empty
                devices = {};
            }
        }

        const activeClients = [];
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        for (const [machineId, data] of Object.entries(devices)) {
            if (new Date(data.lastSeen) > fiveMinutesAgo) {
                activeClients.push({ machineId, ...data });
            }
        }

        // Set response headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.json({ 
            activeClientCount: activeClients.length, 
            clients: activeClients,
            totalDevices: Object.keys(devices).length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in status endpoint:', error);
        
        // Return mock data for testing
        const mockDevice = {
            machineId: '536dedcf-2060-4474-8e70-db3afd12b55e',
            lastSeen: new Date().toISOString(),
            version: '1.0.0',
            platform: 'win32',
            hostname: 'DESKTOP-TEST',
            ip: '127.0.0.1'
        };

        res.json({ 
            activeClientCount: 1, 
            clients: [mockDevice],
            totalDevices: 1,
            timestamp: new Date().toISOString(),
            note: 'Mock data - serverless functions cannot share memory'
        });
    }
}