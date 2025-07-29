// Simple admin login without database dependency for faster response
const ADMIN_CREDENTIALS = {
    'admin': 'beesoft@2025',
    'ekthar': 'Ekthar@8302'
};

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

    // Fast credential check without database
    if (ADMIN_CREDENTIALS[username] && ADMIN_CREDENTIALS[username] === password) {
        return res.status(200).json({ 
            success: true, 
            admin: { 
                username: username,
                role: username === 'ekthar' ? 'super_admin' : 'admin',
                loginTime: new Date().toISOString()
            } 
        });
    }

    // Add a small delay to prevent brute force attacks
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.status(401).json({ error: 'Invalid credentials' });
}