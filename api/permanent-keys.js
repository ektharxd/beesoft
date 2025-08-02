import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    try {
        // Generate new permanent key (POST)
        if (req.method === 'POST') {
            const { count = 1, expiresInDays = null, description = '' } = req.body;
            
            const keys = [];
            for (let i = 0; i < count; i++) {
                let key;
                let attempts = 0;
                
                // Generate unique key
                do {
                    key = generatePermanentKey();
                    attempts++;
                    if (attempts > 100) throw new Error('Unable to generate unique key');
                    
                    // Check uniqueness in Supabase
                    const { data: exists } = await supabase
                        .from('license_keys')
                        .select('key')
                        .eq('key', key);
                    
                    if (!exists || exists.length === 0) break;
                } while (true);
                
                const keyData = {
                    key: key,
                    created_at: new Date().toISOString(),
                    used: false,
                    assigned_to: null,
                    used_at: null,
                    description: description,
                    expires_at: expiresInDays ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)).toISOString() : null,
                    created_by: 'admin',
                    is_active: true
                };
                
                const { data: insertedKey, error } = await supabase
                    .from('license_keys')
                    .insert(keyData)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error inserting key:', error);
                    throw error;
                }
                
                keys.push(insertedKey);
            }

            return res.status(200).json({ 
                success: true, 
                message: `Generated ${count} permanent key(s)`,
                keys: keys.map(k => ({
                    key: k.key,
                    createdAt: k.created_at,
                    expiresAt: k.expires_at,
                    description: k.description
                }))
            });
        }

        // List all permanent keys (GET)
        if (req.method === 'GET') {
            const { data: keys, error } = await supabase
                .from('license_keys')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching keys:', error);
                throw error;
            }
            
            return res.status(200).json({
                success: true,
                keys: (keys || []).map(k => ({
                    key: k.key,
                    createdAt: k.created_at,
                    used: k.used,
                    assignedTo: k.assigned_to,
                    usedAt: k.used_at,
                    expiresAt: k.expires_at,
                    description: k.description,
                    deviceInfo: k.device_info,
                    isActive: k.is_active
                }))
            });
        }

        // Delete permanent key (DELETE)
        if (req.method === 'DELETE') {
            const { key } = req.query;
            if (!key) {
                return res.status(400).json({ error: 'Key parameter is required' });
            }

            const { error } = await supabase
                .from('license_keys')
                .delete()
                .eq('key', key);
            
            if (error) {
                console.error('Error deleting key:', error);
                throw error;
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Permanent key deleted successfully' 
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Error in permanent-keys:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
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