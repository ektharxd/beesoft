import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');
    const admins = db.collection('admins');
    const trialBlacklist = db.collection('trialBlacklist');

    // Handle heartbeat (POST)
    if (req.method === 'POST') {
        try {
            const { machineId, version, platform, hostname, whatsappConnected, sessionActive } = req.body;
            if (!machineId) {
                return res.status(400).send('machineId is required');
            }
            const now = new Date();
            const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
            
            // Check if device exists and if it's blacklisted
            let device = await devices.findOne({ machineId });
            let isBlacklisted = await trialBlacklist.findOne({ machineId });
            
            let trialStart, trialEnd, activated, activationDate, activatedBy;
            const TRIAL_DAYS = 7;
            
            if (!device) {
                // New device: set trial period and not activated
                trialStart = now;
                trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
                activated = false;
                activationDate = null;
                activatedBy = null;
            } else {
                trialStart = device.trialStart || now;
                trialEnd = device.trialEnd || new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
                activated = device.activated || false;
                activationDate = device.activationDate || null;
                activatedBy = device.activatedBy || null;
            }

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
                        trialStart,
                        trialEnd,
                        activated,
                        activationDate,
                        activatedBy
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

            // Calculate status
            let isTrialExpired = false;
            if (trialEnd && now > trialEnd) {
                isTrialExpired = true;
                // Add to blacklist if not already
                if (!isBlacklisted) {
                    await trialBlacklist.insertOne({ machineId });
                    isBlacklisted = true;
                }
            }

            return res.status(200).json({
                machineId,
                trialStart,
                trialEnd,
                activated,
                activationDate,
                activatedBy,
                isTrialExpired,
                isBlacklisted: !!isBlacklisted,
                canUse: activated || (!isTrialExpired && !isBlacklisted)
            });
        } catch (error) {
            console.error('Error in POST handler:', error);
            return res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message 
            });
        }
    }

    // Handle device activation (PATCH)
    if (req.method === 'PATCH') {
        try {
            // Require admin credentials
            const { machineId, adminEmail, adminPassword, verifyOnly, isPermanent, trialDays } = req.body;
            if (!machineId || !adminEmail || !adminPassword) {
                return res.status(400).send('machineId, adminEmail, and adminPassword are required');
            }

            // Check admin in DB
            const admin = await admins.findOne({ email: adminEmail, password: adminPassword });
            if (!admin) {
                return res.status(401).send('Invalid admin credentials');
            }

            // If verifyOnly is true, just return success (admin credentials are valid)
            if (verifyOnly) {
                return res.status(200).send('Admin verified');
            }

            const now = new Date();
            const deviceIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';

            let updateData = {
                activated: isPermanent ? true : false,
                activationDate: now,
                activatedBy: adminEmail,
                lastSeen: now,
                ip: deviceIP
            };

            // If not permanent activation, set trial period
            if (!isPermanent && trialDays) {
                updateData.trialStart = now;
                updateData.trialEnd = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
            }

            // If permanent activation, remove from blacklist
            if (isPermanent) {
                await trialBlacklist.deleteOne({ machineId });
            }

            // Create or update the device
            const result = await devices.updateOne(
                { machineId },
                { 
                    $set: updateData,
                    $setOnInsert: {
                        version: 'unknown',
                        platform: 'unknown',
                        hostname: machineId,
                        whatsappConnected: false,
                        sessionActive: false,
                        logs: [{
                            timestamp: now,
                            type: 'activation',
                            ip: deviceIP,
                            activationType: isPermanent ? 'permanent' : 'trial'
                        }]
                    }
                },
                { upsert: true }
            );

            return res.status(200).send(isPermanent ? 'Device permanently activated' : `Trial set for ${trialDays} days`);
        } catch (error) {
            console.error('Error in PATCH handler:', error);
            return res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message 
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
