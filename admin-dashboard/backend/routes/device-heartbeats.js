const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/device-heartbeats?machineId=xxx - Get heartbeats for a specific device
router.get('/', async (req, res) => {
    try {
        const { machineId } = req.query;
        
        if (!machineId) {
            return res.status(400).json({ error: 'machineId is required' });
        }

        // Fetch heartbeats from the heartbeats table
        const { data: heartbeats, error } = await supabase
            .from('heartbeats')
            .select('*')
            .eq('machine_id', machineId)
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching heartbeats:', error);
            return res.status(500).json({ error: 'Failed to fetch heartbeats', message: error.message });
        }

        return res.status(200).json({
            count: heartbeats ? heartbeats.length : 0,
            heartbeats: heartbeats || []
        });
    } catch (err) {
        console.error('Exception in device-heartbeats:', err);
        return res.status(500).json({ error: 'Failed to fetch heartbeats', message: err.message });
    }
});

module.exports = router;