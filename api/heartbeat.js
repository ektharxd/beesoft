// In-memory store for simplicity. For a real production app, consider a database like SQLite or a free cloud database.
const clients = new Map();

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { machineId, version, platform } = req.body;
    if (!machineId) {
        return res.status(400).send('machineId is required');
    }

    clients.set(machineId, {
        lastSeen: new Date().toISOString(),
        version: version || 'unknown',
        platform: platform || 'unknown',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    console.log(`Heartbeat from ${machineId}`);
    res.status(200).send('OK');
}