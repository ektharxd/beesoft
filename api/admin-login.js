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

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const admins = db.collection('admins');

    // Use email instead of username for authentication
    const admin = await admins.findOne({ email: username, password });
    if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Optionally, generate a session token here for further requests
    return res.status(200).json({ success: true, admin: { email: admin.email } });
}
