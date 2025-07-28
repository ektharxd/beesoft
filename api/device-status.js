import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId } = req.query;
    if (!machineId) {
        return res.status(400).json({ error: 'machineId is required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');

    const device = await devices.findOne({ machineId });
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }
    return res.status(200).json({
        machineId: device.machineId,
        username: device.username,
        subscription: device.subscription || null
    });
}
