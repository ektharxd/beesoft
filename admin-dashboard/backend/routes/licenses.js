
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Dummy middleware for now (replace with Supabase Auth if needed)
const verifyToken = (req, res, next) => { next(); };

// GET /api/admin/licenses - Get all license keys with filtering (Supabase)
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    let query = supabase.from('license_keys').select('*', { count: 'exact' });

    // Filtering
    if (status) {
      if (status === 'available') {
        query = query.eq('used', false).eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      } else if (status === 'used') {
        query = query.eq('used', true);
      } else if (status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      } else if (status === 'deactivated') {
        query = query.eq('is_active', false);
      }
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`key.ilike.%${search}%,description.ilike.%${search}%,assigned_to.ilike.%${search}%,device_info->>username.ilike.%${search}%,device_info->>email.ilike.%${search}%`);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder !== 'desc' });

    // Pagination
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: licenses, count: total, error } = await query;
    if (error) throw error;

    res.json({
      licenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// GET /api/admin/licenses/stats - Get license statistics (Supabase)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data: allKeys, error } = await supabase.from('license_keys').select('*');
    if (error) throw error;
    const stats = {
      totalKeys: allKeys.length,
      availableKeys: allKeys.filter(k => !k.used && k.is_active && (!k.expires_at || new Date(k.expires_at) > new Date())).length,
      usedKeys: allKeys.filter(k => k.used).length,
      expiredKeys: allKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length,
      deactivatedKeys: allKeys.filter(k => !k.is_active).length,
      permanentKeys: allKeys.filter(k => k.type === 'permanent').length,
      trialKeys: allKeys.filter(k => k.type === 'trial').length,
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching license stats:', error);
    res.status(500).json({ error: 'Failed to fetch license statistics' });
  }
});

// POST /api/admin/licenses/generate - Generate new license keys (Supabase)
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const {
      count = 1,
      type = 'permanent',
      days = 9999,
      description,
      expiresAt,
    } = req.body;

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }
    if (type === 'trial' && (!days || days < 1 || days > 365)) {
      return res.status(400).json({ error: 'Trial days must be between 1 and 365' });
    }

    // Generate random keys
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    function generateKey() {
      const segments = [];
      for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
          segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
      }
      return segments.join('-');
    }

    const keys = [];
    for (let i = 0; i < count; i++) {
      let key;
      let attempts = 0;
      do {
        key = generateKey();
        attempts++;
        if (attempts > 100) throw new Error('Unable to generate unique key');
        // Check uniqueness in Supabase
        const { data: exists } = await supabase.from('license_keys').select('key').eq('key', key);
        if (!exists || exists.length === 0) break;
      } while (true);
      keys.push({
        key,
        type,
        days: type === 'trial' ? days : 9999,
        created_by: req.admin?.username || 'system',
        description: description || `${type} license key`,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
        used: false,
        created_at: new Date().toISOString(),
      });
    }
    const { data, error } = await supabase.from('license_keys').insert(keys).select();
    if (error) throw error;
    res.json({
      success: true,
      message: `Generated ${count} license key(s)`,
      keys: data,
    });
  } catch (error) {
    console.error('Error generating license keys:', error);
    res.status(500).json({ error: 'Failed to generate license keys' });
  }
});

// POST /api/admin/licenses/:keyId/deactivate - Deactivate a license key (Supabase)
router.post('/:keyId/deactivate', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Deactivation reason is required' });
    }
    const { data: licenseKey, error } = await supabase.from('license_keys').select('*').eq('id', req.params.keyId).single();
    if (error || !licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    if (!licenseKey.is_active) {
      return res.status(400).json({ error: 'License key is already deactivated' });
    }
    const { data, error: updateError } = await supabase.from('license_keys').update({ is_active: false, deactivated_at: new Date().toISOString(), deactivation_reason: reason, deactivated_by: req.admin?.username || 'system' }).eq('id', req.params.keyId).select();
    if (updateError) throw updateError;
    res.json({ success: true, message: 'License key deactivated successfully', key: data[0] });
  } catch (error) {
    console.error('Error deactivating license key:', error);
    res.status(500).json({ error: 'Failed to deactivate license key' });
  }
});

// POST /api/admin/licenses/:keyId/reactivate - Reactivate a license key (Supabase)
router.post('/:keyId/reactivate', verifyToken, async (req, res) => {
  try {
    const { data: licenseKey, error } = await supabase.from('license_keys').select('*').eq('id', req.params.keyId).single();
    if (error || !licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    if (licenseKey.is_active) {
      return res.status(400).json({ error: 'License key is already active' });
    }
    const { data, error: updateError } = await supabase.from('license_keys').update({ is_active: true, deactivated_at: null, deactivated_by: null, deactivation_reason: null }).eq('id', req.params.keyId).select();
    if (updateError) throw updateError;
    res.json({ success: true, message: 'License key reactivated successfully', key: data[0] });
  } catch (error) {
    console.error('Error reactivating license key:', error);
    res.status(500).json({ error: 'Failed to reactivate license key' });
  }
});

// DELETE /api/admin/licenses/:keyId - Delete a license key (Supabase)
router.delete('/:keyId', verifyToken, async (req, res) => {
  try {
    const { data: licenseKey, error } = await supabase.from('license_keys').select('*').eq('id', req.params.keyId).single();
    if (error || !licenseKey) {
      return res.status(404).json({ error: 'License key not found' });
    }
    if (licenseKey.used) {
      return res.status(400).json({ error: 'Cannot delete a used license key' });
    }
    const { error: deleteError } = await supabase.from('license_keys').delete().eq('id', req.params.keyId);
    if (deleteError) throw deleteError;
    res.json({ success: true, message: 'License key deleted successfully' });
  } catch (error) {
    console.error('Error deleting license key:', error);
    res.status(500).json({ error: 'Failed to delete license key' });
  }
});

// GET /api/admin/licenses/:key/validate - Validate a specific license key (Supabase)
router.get('/:key/validate', verifyToken, async (req, res) => {
  try {
    const { data: licenseKey, error } = await supabase.from('license_keys').select('*').eq('key', req.params.key).single();
    if (error || !licenseKey) {
      return res.json({ valid: false, reason: 'Key not found' });
    }
    if (!licenseKey.is_active) {
      return res.json({ valid: false, reason: 'Key deactivated', key: licenseKey });
    }
    if (licenseKey.expires_at && new Date() > new Date(licenseKey.expires_at)) {
      return res.json({ valid: false, reason: 'Key expired', key: licenseKey });
    }
    if (licenseKey.used) {
      return res.json({
        valid: false,
        reason: 'Key already used',
        key: licenseKey,
        assignedTo: licenseKey.assigned_to,
      });
    }
    res.json({
      valid: true,
      key: licenseKey,
    });
  } catch (error) {
    console.error('Error validating license key:', error);
    res.status(500).json({ error: 'Failed to validate license key' });
  }
});

module.exports = router;