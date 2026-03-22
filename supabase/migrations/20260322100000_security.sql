-- Security hardening: replace wide-open RLS policies with device_id-based access control.
-- The client sends a device fingerprint via the x-device-id header, which Supabase exposes
-- through current_setting('request.headers', true).

-- 1. Add device_id column to both tables
ALTER TABLE push_subscriptions ADD COLUMN device_id text;
ALTER TABLE notification_preferences ADD COLUMN device_id text;

-- 2. Drop the old permissive "allow all" policies
DROP POLICY IF EXISTS "Allow all on push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow all on notification_preferences" ON notification_preferences;

-- 3. Create restrictive policies that match on device_id header

-- push_subscriptions: SELECT
CREATE POLICY "Device can read own subscriptions" ON push_subscriptions
  FOR SELECT
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- push_subscriptions: INSERT
CREATE POLICY "Device can insert own subscriptions" ON push_subscriptions
  FOR INSERT
  WITH CHECK (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- push_subscriptions: UPDATE
CREATE POLICY "Device can update own subscriptions" ON push_subscriptions
  FOR UPDATE
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  )
  WITH CHECK (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- push_subscriptions: DELETE
CREATE POLICY "Device can delete own subscriptions" ON push_subscriptions
  FOR DELETE
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- notification_preferences: SELECT
CREATE POLICY "Device can read own preferences" ON notification_preferences
  FOR SELECT
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- notification_preferences: INSERT
CREATE POLICY "Device can insert own preferences" ON notification_preferences
  FOR INSERT
  WITH CHECK (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- notification_preferences: UPDATE
CREATE POLICY "Device can update own preferences" ON notification_preferences
  FOR UPDATE
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  )
  WITH CHECK (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- notification_preferences: DELETE
CREATE POLICY "Device can delete own preferences" ON notification_preferences
  FOR DELETE
  USING (
    device_id = (current_setting('request.headers', true)::json->>'x-device-id')
  );

-- 4. Create indexes on device_id for efficient policy evaluation
CREATE INDEX idx_push_subscriptions_device_id ON push_subscriptions(device_id);
CREATE INDEX idx_notification_preferences_device_id ON notification_preferences(device_id);
