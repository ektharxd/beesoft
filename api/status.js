// In-memory store for simplicity. For a real production app, consider a database like SQLite or a free cloud database.
const clients = new Map();
const ADMIN_API_KEY = 'Ekthar@8302';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check admin API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        return res.status(401).send('Unauthorized');
    }

    const activeClients = [];
    const now = new Date();
    // A client is "active" if we've seen a heartbeat in the last 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [machineId, data] of clients.entries()) {
        if (new Date(data.lastSeen) > fiveMinutesAgo) {
            activeClients.push({ machineId, ...data });
        }
    }

    res.json({ activeClientCount: activeClients.length, clients: activeClients });
}