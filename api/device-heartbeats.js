import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    try {
        // Fetch heartbeats from the heartbeats table
        const { data: heartbeats, error } = await supabase
            .from('heartbeats')
            .select('*')
            .eq('machine_id', machineId)
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching heartbeats:', error);
            return res.status(500).json({ error: 'Failed to fetch heartbeats' });
        }

        return res.status(200).json({
            count: heartbeats?.length || 0,
            heartbeats: heartbeats || []
        });
    } catch (error) {
        console.error('Error in device-heartbeats:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}