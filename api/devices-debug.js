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

    await client.connect();
    const db = client.db(dbName);
    const devices = db.collection('devices');
    const all = await devices.find().toArray();
    // Only show key fields for debug
    const debugList = all.map(device => ({
        machineId: device.machineId,
        username: device.username,
        subscription: device.subscription,
        lastSeen: device.lastSeen,
        createdAt: device.createdAt,
        _id: device._id
    }));
    return res.status(200).json({
        count: debugList.length,
        devices: debugList
    });
}
