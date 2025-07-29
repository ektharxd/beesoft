import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'beesoft';

const ADMIN_API_KEY = 'Ekthar@8302';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Check admin API key for all operations
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await client.connect();
    const db = client.db(dbName);
    const permanentKeys = db.collection('permanent_keys');

    // Generate new permanent key (POST)
    if (req.method === 'POST') {
        const { count = 1, expiresInDays = null, description = '' } = req.body;
        
        const keys = [];
        for (let i = 0; i < count; i++) {
            const key = generatePermanentKey();
            const keyData = {
                key: key,
                createdAt: new Date(),
                used: false,
                assignedTo: null,
                usedAt: null,
                description: description,
                expiresAt: expiresInDays ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)) : null,
                createdBy: 'admin'
            };
            
            await permanentKeys.insertOne(keyData);
            keys.push(keyData);
        }

        return res.status(200).json({ 
            success: true, 
            message: `Generated ${count} permanent key(s)`,
            keys: keys.map(k => ({
                key: k.key,
                createdAt: k.createdAt,
                expiresAt: k.expiresAt,
                description: k.description
            }))
        });
    }

    // List all permanent keys (GET)
    if (req.method === 'GET') {
        const keys = await permanentKeys.find().sort({ createdAt: -1 }).toArray();
        
        return res.status(200).json({
            success: true,
            keys: keys.map(k => ({
                key: k.key,
                createdAt: k.createdAt,
                used: k.used,
                assignedTo: k.assignedTo,
                usedAt: k.usedAt,
                expiresAt: k.expiresAt,
                description: k.description,
                deviceInfo: k.deviceInfo
            }))
        });
    }

    // Delete permanent key (DELETE)
    if (req.method === 'DELETE') {
        const { key } = req.query;
        if (!key) {
            return res.status(400).json({ error: 'Key parameter is required' });
        }

        const result = await permanentKeys.deleteOne({ key: key });
        if (result.deletedCount > 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'Permanent key deleted successfully' 
            });
        } else {
            return res.status(404).json({ 
                error: 'Permanent key not found' 
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// Generate a secure permanent key
function generatePermanentKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    
    let key = '';
    for (let i = 0; i < segments; i++) {
        if (i > 0) key += '-';
        for (let j = 0; j < segmentLength; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return key;
}