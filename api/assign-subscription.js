import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId, type, days, key } = req.body;
    if (!machineId || !type || typeof days !== 'number') {
        return res.status(400).json({ error: 'machineId, type, and days are required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');
    const permanentKeys = db.collection('permanent_keys');

    // Check if device exists
    const device = await devices.findOne({ machineId });
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    // Handle permanent activation
    if (type === 'subscription' || type === 'permanent') {
        if (!key) {
            return res.status(400).json({ error: 'Permanent activation key is required' });
        }

        // Enforce key format: ABCD-1234-EFGH-5678
        const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!keyPattern.test(key)) {
            return res.status(400).json({ error: 'Invalid key format. Use format: ABCD-1234-EFGH-5678' });
        }

        // Check if the key exists and is valid
        const permanentKey = await permanentKeys.findOne({ key: key });
        if (!permanentKey) {
            return res.status(400).json({ error: 'Invalid activation key' });
        }

        // Check if key is already used
        if (permanentKey.used && permanentKey.assignedTo !== machineId) {
            return res.status(400).json({ 
                error: 'Activation key already used',
                message: `This key has already been used by another device`
            });
        }

        // Check if key is expired
        if (permanentKey.expiresAt && new Date() > new Date(permanentKey.expiresAt)) {
            return res.status(400).json({ error: 'Activation key has expired' });
        }

        // Mark the key as used
        await permanentKeys.updateOne(
            { key: key },
            {
                $set: {
                    used: true,
                    assignedTo: machineId,
                    usedAt: new Date(),
                    deviceInfo: {
                        username: device.username,
                        platform: device.platform,
                        hostname: device.hostname
                    }
                }
            }
        );

        // Update device with permanent subscription
        const result = await devices.updateOne(
            { machineId },
            {
                $set: {
                    'subscription.type': 'permanent',
                    'subscription.days': 9999,
                    'subscription.start': new Date(),
                    'subscription.active': true,
                    'subscription.key': key,
                    'subscription.activatedAt': new Date()
                },
                $push: {
                    logs: {
                        timestamp: new Date(),
                        type: 'permanent_activation',
                        key: key,
                        activatedBy: 'admin'
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Device permanently activated successfully',
            subscription: {
                type: 'permanent',
                activatedAt: new Date(),
                key: key
            }
        });
    }

    // Handle trial activation
    if (type === 'trial') {
        const result = await devices.updateOne(
            { machineId },
            {
                $set: {
                    'subscription.type': 'trial',
                    'subscription.days': days,
                    'subscription.start': new Date(),
                    'subscription.active': true,
                    'subscription.activatedAt': new Date()
                },
                $push: {
                    logs: {
                        timestamp: new Date(),
                        type: 'trial_activation',
                        days: days,
                        activatedBy: 'admin'
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Trial activated for ${days} days`,
            subscription: {
                type: 'trial',
                days: days,
                activatedAt: new Date(),
                expiresAt: new Date(Date.now() + (days * 24 * 60 * 60 * 1000))
            }
        });
    }

    return res.status(400).json({ error: 'Invalid subscription type' });
}