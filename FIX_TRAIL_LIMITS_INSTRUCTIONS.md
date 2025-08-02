# Fix Trail Limits in App - Complete Instructions

## Issue
The trail limits are not updating in the desktop app because the message-limits API is not reading from the new database structure properly.

## Step 1: Run the Database Fix Query

Copy and paste this SQL into your Supabase SQL Editor:

```sql
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
```

## Step 2: Update the Backend Message Limits Route

1. **Navigate to**: `admin-dashboard/backend/routes/`
2. **Rename the file**: `message-limits.js` to `message-limits-old.js`
3. **Rename the file**: `message-limits-fixed.js` to `message-limits.js`

OR

**Replace the content** of `admin-dashboard/backend/routes/message-limits.js` with the content from `message-limits-fixed.js`

## Step 3: Fix the Backend App.js (if needed)

If you see syntax errors in `admin-dashboard/backend/app.js`, fix the missing commas:

**Find lines like**:
```javascript
app.use('/api/admin/devices' deviceRoutes);
app.use('/api/admin/licenses' licenseRoutes);
app.use('/api/message-limits' messageLimitsRoutes);
```

**Replace with**:
```javascript
app.use('/api/admin/devices', deviceRoutes);
app.use('/api/admin/licenses', licenseRoutes);
app.use('/api/message-limits', messageLimitsRoutes);
```

## Step 4: Start the Backend Server

```bash
cd admin-dashboard/backend
npm install
npm start
```

## Step 5: Test the Desktop App

1. **Restart your desktop app**
2. **Check if trail limits now show properly**
3. **Try sending a message** to see if limits update

## Expected Results

After these fixes:

✅ **Desktop app will show**: "Trial: 1000 messages (45 used), 100 daily (5 used)"
✅ **Message limits will update** in real-time when messages are sent
✅ **Admin dashboard** will show correct usage statistics
✅ **API endpoint** `http://localhost:4000/api/message-limits?machineId=xxx` will return proper data

## Verification

Test the API directly:
```bash
curl "http://localhost:4000/api/message-limits?machineId=2372aa27f40ac256d160c55f45561f64abefab095ed7de086c022c3716bee7fe"
```

Should return:
```json
{
  "success": true,
  "messageStats": {
    "type": "trial",
    "unlimited": false,
    "subscriptionActive": true,
    "totalLimit": 1000,
    "totalUsed": 45,
    "totalRemaining": 955,
    "dailyLimit": 100,
    "dailyUsed": 5,
    "dailyRemaining": 95
  },
  "canSendMessages": true
}
```

## Troubleshooting

If limits still don't update:

1. **Check backend logs** for any errors
2. **Verify the database** has the subscription JSONB column populated
3. **Restart both** the backend server and desktop app
4. **Check the API response** manually using curl or browser

The issue was that the message-limits API was expecting the old JSONB format, but we created separate columns. This fix creates both formats for compatibility.