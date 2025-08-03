// Initialize some sample permanent keys for testing
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://104.154.62.181:27017';
const client = new MongoClient(uri);
const dbName = 'beesoft';

async function initializeKeys() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(dbName);
        const permanentKeys = db.collection('permanent_keys');
        
        // Sample keys for testing
        const sampleKeys = [
            {
                key: 'TEST-1234-ABCD-5678',
                createdAt: new Date(),
                used: false,
                assignedTo: null,
                usedAt: null,
                description: 'Test key 1',
                expiresAt: null,
                createdBy: 'system'
            },
            {
                key: 'DEMO-9876-WXYZ-4321',
                createdAt: new Date(),
                used: false,
                assignedTo: null,
                usedAt: null,
                description: 'Demo key 1',
                expiresAt: null,
                createdBy: 'system'
            },
            {
                key: 'PERM-5555-AAAA-9999',
                createdAt: new Date(),
                used: false,
                assignedTo: null,
                usedAt: null,
                description: 'Permanent activation key',
                expiresAt: null,
                createdBy: 'system'
            }
        ];
        
        // Check if keys already exist
        for (const keyData of sampleKeys) {
            const existing = await permanentKeys.findOne({ key: keyData.key });
            if (!existing) {
                await permanentKeys.insertOne(keyData);
                console.log(`Created key: ${keyData.key}`);
            } else {
                console.log(`Key already exists: ${keyData.key}`);
            }
        }
        
        console.log('Sample keys initialized successfully');
        
    } catch (error) {
        console.error('Error initializing keys:', error);
    } finally {
        await client.close();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initializeKeys();
}

module.exports = { initializeKeys };