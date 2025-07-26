const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory store for simplicity. For a real production app, consider a database like SQLite or a free cloud database.
const clients = new Map();
const ADMIN_API_KEY = 'your-super-secret-admin-key'; // IMPORTANT: Change this and keep it secret!

// Middleware to protect the admin status route
const requireAdminKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === ADMIN_API_KEY) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
};

// Endpoint for your Electron app to send heartbeats
app.post('/api/heartbeat', (req, res) => {
    const { machineId, version, platform } = req.body;
    if (!machineId) {
        return res.status(400).send('machineId is required');
    }

    clients.set(machineId, {
        lastSeen: new Date().toISOString(),
        version: version || 'unknown',
        platform: platform || 'unknown',
        ip: req.ip // The client's IP address
    });

    console.log(`Heartbeat from ${machineId}`);
    res.status(200).send('OK');
});

// Endpoint for you (the admin) to view the list of active clients
app.get('/api/status', requireAdminKey, (req, res) => {
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
});

app.listen(port, () => {
    console.log(`Beesoft Status Server listening on port ${port}`);
});