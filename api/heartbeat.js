import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Use /tmp directory for temporary storage on Vercel
const DATA_FILE = '/tmp/devices.json';

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

function writeDevices(devices) {
    try {
        writeFileSync(DATA_FILE, JSON.stringify(devices, null, 2));
    } catch (error) {
        console.error('Error writing devices:', error);
    }
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId, version, platform, hostname } = req.body;
    if (!machineId) {
        return res.status(400).send('machineId is required');
    }

    // Read existing devices
    const devices = readDevices();

    // Update device info
    devices[machineId] = {
        lastSeen: new Date().toISOString(),
        version: version || 'unknown',
        platform: platform || 'unknown',
        hostname: hostname || machineId,
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    };

    // Write back to file
    writeDevices(devices);

    console.log(`Heartbeat from ${machineId} (${hostname})`);
    res.status(200).send('OK');
}