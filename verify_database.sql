-- Verification queries to check if the fixes worked
-- Run these after running the database_fixes.sql

-- 1. Check if heartbeats table exists and has data
SELECT 'Heartbeats table check:' as check_type;
SELECT COUNT(*) as heartbeat_count FROM heartbeats;
SELECT machine_id, timestamp, whatsapp_connected, session_active 
FROM heartbeats 
ORDER BY timestamp DESC 
LIMIT 5;

-- 2. Check devices table structure and data
SELECT 'Devices table check:' as check_type;
SELECT 
    machine_id,
    username,
    subscription_type,
    subscription_active,
    subscription_expires_at,
    message_limit,
    daily_message_limit,
    last_seen,
    is_banned
FROM devices 
LIMIT 5;

-- 3. Check device status view
SELECT 'Device status view check:' as check_type;
SELECT 
    machine_id,
    username,
    subscription_status,
    days_remaining,
    is_online,
    message_limit,
    daily_message_limit
FROM device_status_view 
LIMIT 5;

-- 4. Check license keys table
SELECT 'License keys table check:' as check_type;
SELECT COUNT(*) as license_count FROM license_keys;
SELECT key, type, is_active, used, assigned_to 
FROM license_keys 
LIMIT 5;

-- 5. Check for devices that should be online (last seen within 2 minutes)
SELECT 'Online devices check:' as check_type;
SELECT COUNT(*) as online_devices 
FROM devices 
WHERE last_seen > NOW() - INTERVAL '2 minutes';

-- 6. Check subscription status distribution
SELECT 'Subscription status distribution:' as check_type;
SELECT 
    subscription_status,
    COUNT(*) as count
FROM device_status_view 
GROUP BY subscription_status;

-- 7. Check if any devices have proper time stamps
SELECT 'Recent activity check:' as check_type;
SELECT 
    machine_id,
    last_seen,
    NOW() - last_seen as time_since_last_seen
FROM devices 
WHERE last_seen IS NOT NULL
ORDER BY last_seen DESC
LIMIT 5;