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

    const { machineId, type, days } = req.body;
    if (!machineId || !type || typeof days !== 'number') {
        return res.status(400).json({ error: 'machineId, type, and days are required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');

    // Update subscription info for the device
    const result = await devices.updateOne(
        { machineId },
        {
            $set: {
                'subscription.type': type,
                'subscription.days': days,
                'subscription.start': new Date(),
                'subscription.active': true
            }
        }
    );
    if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Device not found' });
    }
    return res.status(200).json({ success: true });
}
