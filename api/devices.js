import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');

    // Device registration (POST /api/devices?register=1)
    if (req.method === 'POST' && req.query.register === '1') {
        const { machineId, username, email, mobile, name } = req.body;
        if (!machineId || !username || !email || !mobile || !name) {
            return res.status(400).json({ error: 'machineId, username, email, mobile, and name are required' });
        }
        
        // Check if device already exists
        const existingDevice = await devices.findOne({ machineId });
        if (existingDevice) {
            return res.status(409).json({ 
                error: 'Device already registered', 
                message: `Device ${machineId} is already registered with username: ${existingDevice.username}`,
                device: {
                    machineId: existingDevice.machineId,
                    username: existingDevice.username,
                    registeredAt: existingDevice.createdAt
                }
            });
        }
        
        // Register new device with username and generate empty subscription/trial info
        const newDevice = {
            machineId,
            username,
            email,
            mobile,
            name,
            subscription: { type: 'trial', days: 0, start: null, active: false },
            createdAt: new Date(),
            lastSeen: new Date(),
            version: 'unknown',
            platform: 'unknown',
            hostname: machineId,
            ip: 'unknown',
            whatsappConnected: false,
            sessionActive: false,
            logs: [{
                timestamp: new Date(),
                type: 'registration',
                ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
                username: username,
                email: email,
                mobile: mobile,
                name: name
            }]
        };
        
        await devices.insertOne(newDevice);
        return res.status(200).json({ 
            success: true, 
            message: `Device ${machineId} registered successfully`,
            device: {
                machineId: newDevice.machineId,
                username: newDevice.username,
                registeredAt: newDevice.createdAt
            }
        });
    }

    // Handle heartbeat (POST)
    if (req.method === 'POST') {
        const { machineId, version, platform, hostname, whatsappConnected, sessionActive } = req.body;
        if (!machineId) {
            return res.status(400).send('machineId is required');
        }
        const now = new Date();
        const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
        // Upsert device and add log, preserve username/subscription if already set
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

    // Handle device removal (DELETE /api/devices?remove=1&machineId=xxx)
    if (req.method === 'DELETE' && req.query.remove === '1') {
        const { machineId } = req.query;
        if (!machineId) {
            return res.status(400).json({ error: 'machineId is required' });
        }
        
        const result = await devices.deleteOne({ machineId });
        if (result.deletedCount > 0) {
            return res.status(200).json({ 
                success: true, 
                message: `Device ${machineId} removed successfully` 
            });
        } else {
            return res.status(404).json({ 
                error: 'Device not found',
                message: `Device ${machineId} is not registered in the database`
            });
        }
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