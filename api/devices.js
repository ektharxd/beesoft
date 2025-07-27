import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');

    // Handle heartbeat (POST)
    if (req.method === 'POST') {
        const { machineId, version, platform, hostname, whatsappConnected, sessionActive } = req.body;
        if (!machineId) {
            return res.status(400).send('machineId is required');
        }
        const now = new Date();
        const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
        // Upsert device and add log
        await devices.updateOne(
            { machineId },
            {
                $set: {
                    machineId,
                    version: version || 'unknown',
                    platform: platform || 'unknown',
                    hostname: hostname || machineId,
                    ip: deviceIP,
                    whatsappConnected: whatsappConnected || false,
                    sessionActive: sessionActive || false,
                    lastSeen: now,
                },
                $push: {
                    logs: {
                        timestamp: now,
                        type: 'heartbeat',
                        ip: deviceIP,
                        whatsappConnected: whatsappConnected || false,
                        sessionActive: sessionActive || false,
                        version: version || 'unknown',
                    }
                }
            },
            { upsert: true }
        );
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
        const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
        const all = await devices.find().toArray();
        const allDevicesList = [];
        const activeDevices = [];
        const offlineDevices = [];
        for (const device of all) {
            const isOnline = new Date(device.lastSeen) > oneMinuteAgo;
            const deviceData = {
                ...device,
                isOnline,
                logs: device.logs || []
            };
            allDevicesList.push(deviceData);
            if (isOnline) {
                activeDevices.push(deviceData);
            } else {
                offlineDevices.push(deviceData);
            }
        }
        // Sort by last seen (most recent first)
        allDevicesList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
        activeDevices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
        offlineDevices.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
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
}
