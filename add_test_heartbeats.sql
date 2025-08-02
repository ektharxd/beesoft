-- Add test heartbeat data to make devices appear online and active

-- 1. Insert recent heartbeats for the specific device you mentioned
INSERT INTO heartbeats (
    machine_id, 
    timestamp, 
    ip, 
    hostname, 
    platform, 
    whatsapp_connected, 
    session_active, 
    version,
    system_info,
    app_info
) VALUES 
(
    '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe',
    NOW() - INTERVAL '30 seconds',
    '192.168.1.100',
    'DESKTOP-UJGGI5U',
    'win32',
    TRUE,
    TRUE,
    '1.0.0',
    '{"arch": "x64", "platform": "win32", "totalMemory": 8589934592}',
    '{"connectionAttempts": 0, "messageCount": 0}'
),
(
    '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe',
    NOW() - INTERVAL '1 minute',
    '192.168.1.100',
    'DESKTOP-UJGGI5U',
    'win32',
    TRUE,
    TRUE,
    '1.0.0',
    '{"arch": "x64", "platform": "win32", "totalMemory": 8589934592}',
    '{"connectionAttempts": 0, "messageCount": 0}'
),
(
    '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe',
    NOW() - INTERVAL '2 minutes',
    '192.168.1.100',
    'DESKTOP-UJGGI5U',
    'win32',
    TRUE,
    TRUE,
    '1.0.0',
    '{"arch": "x64", "platform": "win32", "totalMemory": 8589934592}',
    '{"connectionAttempts": 0, "messageCount": 0}'
);

-- 2. Add heartbeats for other devices if they exist
INSERT INTO heartbeats (machine_id, timestamp, ip, hostname, platform, whatsapp_connected, session_active, version)
SELECT 
    machine_id,
    NOW() - (RANDOM() * INTERVAL '2 minutes'), -- Random time within last 2 minutes
    '192.168.1.' || (100 + (RANDOM() * 50)::INT), -- Random IP
    COALESCE(hostname, username, 'Unknown'),
    COALESCE(platform, 'win32'),
    TRUE, -- WhatsApp connected
    TRUE, -- Session active
    '1.0.0'
FROM devices 
WHERE machine_id IS NOT NULL 
    AND machine_id != '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe'
ON CONFLICT DO NOTHING;

-- 3. Update all devices to have recent last_seen timestamps
UPDATE devices 
SET last_seen = NOW() - (RANDOM() * INTERVAL '1 minute')
WHERE machine_id IS NOT NULL;

-- 4. Ensure all devices have active trial subscriptions
UPDATE devices 
SET 
    subscription_type = 'trial',
    subscription_active = TRUE,
    subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_activated_at = NOW(),
    message_limit = 1000,
    daily_message_limit = 100,
    messages_used = FLOOR(RANDOM() * 50)::INT, -- Random usage between 0-50
    daily_messages_used = FLOOR(RANDOM() * 10)::INT -- Random daily usage between 0-10
WHERE machine_id IS NOT NULL;

-- 5. Check the results
SELECT 'Updated Device Status:' as info;
SELECT 
    machine_id,
    username,
    subscription_type,
    subscription_active,
    message_limit,
    daily_message_limit,
    messages_used,
    daily_messages_used,
    last_seen,
    NOW() - last_seen as time_ago
FROM devices;

SELECT 'Recent Heartbeats:' as info;
SELECT 
    machine_id,
    timestamp,
    whatsapp_connected,
    session_active,
    NOW() - timestamp as time_ago
FROM heartbeats 
ORDER BY timestamp DESC 
LIMIT 10;