-- Create app_settings table for PIN hash storage
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a pin_hash exists (for login verification)
CREATE POLICY "Anyone can read settings by pin_hash" ON app_settings
  FOR SELECT USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');

-- Anyone can register a new PIN (insert)
CREATE POLICY "Anyone can register" ON app_settings
  FOR INSERT WITH CHECK (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');

-- Add pin_hash column to existing tables
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS pin_hash text;

-- Drop ALL existing device_id-based policies
DROP POLICY IF EXISTS "Device can read own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Device can insert own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Device can update own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Device can delete own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Device can read own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Device can insert own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Device can update own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Device can delete own preferences" ON notification_preferences;

-- New RLS policies using x-pin-hash header for notification_preferences
CREATE POLICY "Pin can read own preferences" ON notification_preferences
  FOR SELECT USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can update own preferences" ON notification_preferences
  FOR UPDATE USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash')
  WITH CHECK (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can delete own preferences" ON notification_preferences
  FOR DELETE USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');

-- New RLS policies using x-pin-hash header for push_subscriptions
CREATE POLICY "Pin can read own subscriptions" ON push_subscriptions
  FOR SELECT USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash')
  WITH CHECK (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');
CREATE POLICY "Pin can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (pin_hash = current_setting('request.headers', true)::json->>'x-pin-hash');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_pin_hash ON notification_preferences(pin_hash);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_pin_hash ON push_subscriptions(pin_hash);

-- Add unique constraint on push_subscriptions.pin_hash for upsert support
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_pin_hash_unique UNIQUE (pin_hash);
