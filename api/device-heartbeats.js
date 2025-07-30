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
    const heartbeats = db.collection('heartbeats');
    const logs = await heartbeats.find({ machineId }).sort({ timestamp: -1 }).limit(100).toArray();
    return res.status(200).json({
        count: logs.length,
        heartbeats: logs
    });
}
