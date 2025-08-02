-- Fix the message limits API to work with the new database structure
-- This ensures the desktop app can read the trial limits properly

-- 1. First, let's check what the current message limits API expects
-- The API looks for a 'subscription' JSONB column, so we need to create that

-- Add the subscription JSONB column if it doesn't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS subscription JSONB;

-- 2. Update the subscription JSONB column with the proper structure
-- This matches what the message-limits API expects
UPDATE devices 
SET subscription = jsonb_build_object(
    'type', subscription_type,
    'active', subscription_active,
    'messageLimit', message_limit,
    'dailyMessageLimit', daily_message_limit,
    'messagesUsed', messages_used,
    'dailyMessagesUsed', daily_messages_used,
    'start', subscription_activated_at,
    'expires', subscription_expires_at,
    'days', CASE 
        WHEN subscription_type = 'trial' AND subscription_expires_at IS NOT NULL THEN
            EXTRACT(days FROM (subscription_expires_at - subscription_activated_at))::INTEGER
        ELSE NULL
    END,
    'key', license_key,
    'lastDailyReset', last_daily_reset
)
WHERE machine_id IS NOT NULL;

-- 3. Check the updated subscription data
SELECT 'Updated Subscription Data:' as info;
SELECT 
    machine_id,
    username,
    subscription_type,
    subscription_active,
    subscription
FROM devices
LIMIT 5;

-- 4. Create a trigger to automatically update the subscription JSONB when other columns change
CREATE OR REPLACE FUNCTION update_subscription_jsonb()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subscription = jsonb_build_object(
        'type', NEW.subscription_type,
        'active', NEW.subscription_active,
        'messageLimit', NEW.message_limit,
        'dailyMessageLimit', NEW.daily_message_limit,
        'messagesUsed', NEW.messages_used,
        'dailyMessagesUsed', NEW.daily_messages_used,
        'start', NEW.subscription_activated_at,
        'expires', NEW.subscription_expires_at,
        'days', CASE 
            WHEN NEW.subscription_type = 'trial' AND NEW.subscription_expires_at IS NOT NULL THEN
                EXTRACT(days FROM (NEW.subscription_expires_at - NEW.subscription_activated_at))::INTEGER
            ELSE NULL
        END,
        'key', NEW.license_key,
        'lastDailyReset', NEW.last_daily_reset
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_subscription_jsonb ON devices;
CREATE TRIGGER trigger_update_subscription_jsonb
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_jsonb();

-- 5. Test the message limits for your specific device
SELECT 'Message Limits Test for Your Device:' as info;
SELECT 
    machine_id,
    username,
    subscription->>'type' as sub_type,
    (subscription->>'active')::boolean as sub_active,
    (subscription->>'messageLimit')::integer as total_limit,
    (subscription->>'dailyMessageLimit')::integer as daily_limit,
    (subscription->>'messagesUsed')::integer as total_used,
    (subscription->>'dailyMessagesUsed')::integer as daily_used,
    subscription->>'start' as start_date,
    subscription->>'expires' as expires_date
FROM devices 
WHERE machine_id = '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe';

-- 6. Simulate what the message-limits API should return
SELECT 'API Response Simulation:' as info;
WITH device_data AS (
    SELECT * FROM devices 
    WHERE machine_id = '2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe'
)
SELECT 
    jsonb_build_object(
        'success', true,
        'messageStats', jsonb_build_object(
            'type', subscription->>'type',
            'unlimited', false,
            'subscriptionActive', (subscription->>'active')::boolean,
            'subscriptionType', subscription->>'type',
            'totalLimit', (subscription->>'messageLimit')::integer,
            'totalUsed', (subscription->>'messagesUsed')::integer,
            'totalRemaining', GREATEST(0, (subscription->>'messageLimit')::integer - (subscription->>'messagesUsed')::integer),
            'dailyLimit', (subscription->>'dailyMessageLimit')::integer,
            'dailyUsed', (subscription->>'dailyMessagesUsed')::integer,
            'dailyRemaining', GREATEST(0, (subscription->>'dailyMessageLimit')::integer - (subscription->>'dailyMessagesUsed')::integer),
            'lastDailyReset', subscription->>'lastDailyReset',
            'subscriptionStart', subscription->>'start',
            'subscriptionDays', (subscription->>'days')::integer,
            'subscriptionKey', subscription->>'key'
        ),
        'canSendMessages', true,
        'messagesRemaining', GREATEST(0, (subscription->>'messageLimit')::integer - (subscription->>'messagesUsed')::integer),
        'dailyMessagesRemaining', GREATEST(0, (subscription->>'dailyMessageLimit')::integer - (subscription->>'dailyMessagesUsed')::integer)
    ) as api_response
FROM device_data;