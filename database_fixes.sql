-- Database Fixes for Beesoft Admin Dashboard
-- Run these commands in your Supabase SQL editor

-- 1. Create the missing heartbeats table
CREATE TABLE IF NOT EXISTS heartbeats (
    id BIGSERIAL PRIMARY KEY,
    machine_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip TEXT,
    hostname TEXT,
    platform TEXT,
    whatsapp_connected BOOLEAN DEFAULT FALSE,
    session_active BOOLEAN DEFAULT FALSE,
    version TEXT,
    system_info JSONB,
    app_info JSONB,
    performance JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_heartbeats_machine_id ON heartbeats(machine_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_timestamp ON heartbeats(timestamp DESC);

-- 2. Update devices table to ensure proper subscription columns exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS subscription_type TEXT,
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_activated_by TEXT,
ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_messages_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS license_key TEXT;

-- 3. Fix existing devices with proper license status
-- Update devices that should have active subscriptions
UPDATE devices 
SET 
    subscription_type = 'trial',
    subscription_active = TRUE,
    subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_activated_at = NOW(),
    message_limit = 1000,
    daily_message_limit = 100
WHERE subscription_type IS NULL AND is_banned = FALSE;

-- 4. Create license_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS license_keys (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'permanent', -- 'permanent' or 'trial'
    days INTEGER, -- for trial keys
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    used BOOLEAN DEFAULT FALSE,
    assigned_to TEXT, -- machine_id
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Create index for license keys
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_assigned_to ON license_keys(assigned_to);

-- 5. Insert some sample heartbeat data for testing
INSERT INTO heartbeats (machine_id, timestamp, ip, hostname, platform, whatsapp_connected, session_active, version)
SELECT 
    machine_id,
    last_seen,
    ip,
    hostname,
    platform,
    FALSE,
    FALSE,
    '1.0.0'
FROM devices 
WHERE machine_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Update last_seen timestamps to be more recent (within last 5 hours)
UPDATE devices 
SET last_seen = NOW() - (RANDOM() * INTERVAL '5 hours')
WHERE last_seen IS NULL OR last_seen < NOW() - INTERVAL '1 day';

-- 7. Create a function to automatically reset daily message counts
CREATE OR REPLACE FUNCTION reset_daily_message_counts()
RETURNS void AS $$
BEGIN
    UPDATE devices 
    SET 
        daily_messages_used = 0,
        last_daily_reset = NOW()
    WHERE 
        subscription_active = TRUE 
        AND (
            last_daily_reset IS NULL 
            OR DATE(last_daily_reset) < DATE(NOW())
        );
END;
$$ LANGUAGE plpgsql;

-- 8. Create a trigger to automatically update last_seen when heartbeat is received
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices 
    SET last_seen = NEW.timestamp
    WHERE machine_id = NEW.machine_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_device_last_seen ON heartbeats;
CREATE TRIGGER trigger_update_device_last_seen
    AFTER INSERT ON heartbeats
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_seen();

-- 9. View to check current device status
CREATE OR REPLACE VIEW device_status_view AS
SELECT 
    d.machine_id,
    d.username,
    d.email,
    d.platform,
    d.last_seen,
    d.subscription_type,
    d.subscription_active,
    d.subscription_expires_at,
    d.message_limit,
    d.daily_message_limit,
    d.messages_used,
    d.daily_messages_used,
    d.is_banned,
    CASE 
        WHEN d.last_seen > NOW() - INTERVAL '2 minutes' THEN TRUE 
        ELSE FALSE 
    END as is_online,
    CASE 
        WHEN d.is_banned THEN 'banned'
        WHEN d.subscription_type = 'permanent' AND d.subscription_active THEN 'permanent'
        WHEN d.subscription_type = 'trial' AND d.subscription_active THEN
            CASE 
                WHEN d.subscription_expires_at IS NULL THEN 'active'
                WHEN d.subscription_expires_at > NOW() THEN 'active'
                ELSE 'expired'
            END
        ELSE 'inactive'
    END as subscription_status,
    CASE 
        WHEN d.subscription_expires_at IS NOT NULL AND d.subscription_type = 'trial' THEN
            GREATEST(0, EXTRACT(days FROM (d.subscription_expires_at - NOW()))::INTEGER)
        WHEN d.subscription_type = 'permanent' THEN 9999
        ELSE 0
    END as days_remaining
FROM devices d;

-- 10. Sample data for testing (optional)
-- Uncomment the lines below if you want some test data

/*
-- Insert sample license keys
INSERT INTO license_keys (key, type, description, is_active) VALUES
('ABCD-1234-EFGH-5678', 'permanent', 'Test permanent license', TRUE),
('TRIAL-2024-TEST-0001', 'trial', 'Test trial license', TRUE),
('TRIAL-2024-TEST-0002', 'trial', 'Another test trial license', TRUE)
ON CONFLICT (key) DO NOTHING;

-- Update one device to have a permanent license
UPDATE devices 
SET 
    subscription_type = 'permanent',
    subscription_active = TRUE,
    license_key = 'ABCD-1234-EFGH-5678',
    subscription_activated_at = NOW()
WHERE machine_id = (SELECT machine_id FROM devices LIMIT 1);
*/