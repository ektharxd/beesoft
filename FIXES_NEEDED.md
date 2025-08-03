# Fixes Needed for Admin Dashboard Issues

Based on the console errors, here are the fixes needed:

## Issue 1: 404 Error for device-heartbeats endpoint

**Problem**: `GET http://104.154.62.181:4000/api/device-heartbeats?machineId=... 404 (Not Found)`

**Solution**: Start the backend server on port 4000:

```bash
cd admin-dashboard/backend
npm install
npm start
```

The route is already configured in `app.js` and the `device-heartbeats.js` file exists.

## Issue 2: Fix the heartbeats fetch to handle 404 gracefully

**Problem**: The frontend crashes when heartbeats endpoint returns 404

**File**: `public/admin-dashboard-new.html`

**Find this code** (around line 2250):
```javascript
// Fetch heartbeats from the backend
const heartbeatsRes = await fetch(`http://104.154.62.181:4000/api/device-heartbeats?machineId=${encodeURIComponent(machineId)}`);
const heartbeatsData = await heartbeatsRes.json();
```

**Replace with**:
```javascript
// Try to fetch heartbeats from the backend, but handle 404 gracefully
let heartbeatsData = { heartbeats: [] };
try {
  const heartbeatsRes = await fetch(`http://104.154.62.181:4000/api/device-heartbeats?machineId=${encodeURIComponent(machineId)}`);
  if (heartbeatsRes.ok) {
    heartbeatsData = await heartbeatsRes.json();
  } else {
    console.warn('Heartbeats endpoint not available:', heartbeatsRes.status);
  }
} catch (error) {
  console.warn('Failed to fetch heartbeats:', error.message);
}
```

## Issue 3: Fix device deletion for MAC address machine IDs

**Problem**: Device deletion fails for machine IDs with colons (like MAC addresses)

**File**: `public/admin-dashboard-new.html`

**Find the removeDevice function** and update the API call:

**Find this code**:
```javascript
await apiRequest(`/devices/${machineId}`, {
  method: 'DELETE'
});
```

**Replace with**:
```javascript
// Encode the machine ID to handle special characters like colons
const encodedMachineId = encodeURIComponent(machineId);
await apiRequest(`/devices/${encodedMachineId}`, {
  method: 'DELETE'
});
```

## Issue 4: Fix backend devices.js syntax errors

**File**: `admin-dashboard/backend/routes/devices.js`

The file has syntax errors (missing commas). You need to:

1. Check for missing commas in object properties
2. Fix the DELETE route to handle URL-encoded machine IDs
3. Add proper error logging

**Example fix for DELETE route**:
```javascript
// DELETE /api/admin/devices/:machineId - Remove device
router.delete('/:machineId', verifyToken, async function(req, res) {
  try {
    // Decode the machine ID in case it contains special characters like colons
    const machineId = decodeURIComponent(req.params.machineId);
    console.log('Attempting to delete device with machine_id:', machineId);
    
    const { data, error } = await supabase
      .from('devices')
      .delete()
      .eq('machine_id', machineId)
      .select(); // Add select to get the deleted rows
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      console.log('No device found with machine_id:', machineId);
      return res.status(404).json({ error: 'Device not found' });
    }
    
    console.log('Device deleted successfully:', data);
    res.json({ success: true, message: 'Device removed successfully' });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});
```

## Summary

1. **Start the backend server** on port 4000
2. **Fix the heartbeats fetch** to handle 404 errors gracefully
3. **Encode machine IDs** in the frontend before sending to API
4. **Fix syntax errors** in the backend devices.js file

After these fixes:
- The device-heartbeats endpoint should work
- License status should show correctly
- Message limits should update properly
- Device deletion should work for all machine ID formats
- Time synchronization should be correct