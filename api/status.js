import { readFileSync, existsSync } from 'fs';

// Use /tmp directory for temporary storage on Vercel
const DATA_FILE = '/tmp/devices.json';
const ADMIN_API_KEY = 'Ekthar@8302';

function readDevices() {
    try {
        if (existsSync(DATA_FILE)) {
            const data = readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading devices:', error);
    }
    return {};
}

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check admin API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).send('Unauthorized');
    }

    // Read devices from file
    const devices = readDevices();
    const activeClients = [];
    const now = new Date();
    
    // A client is "active" if we've seen a heartbeat in the last 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [machineId, data] of Object.entries(devices)) {
        if (new Date(data.lastSeen) > fiveMinutesAgo) {
            activeClients.push({ machineId, ...data });
        }
    }

    res.json({ 
        activeClientCount: activeClients.length, 
        clients: activeClients,
        totalDevices: Object.keys(devices).length
    });
}