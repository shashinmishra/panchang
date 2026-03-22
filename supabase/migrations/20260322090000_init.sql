-- Push subscription storage for web push notifications
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences per date
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key text NOT NULL,
  days_before integer NOT NULL DEFAULT 1,
  repeat text NOT NULL DEFAULT 'once' CHECK (repeat IN ('once', 'daily')),
  enabled boolean NOT NULL DEFAULT true,
  label text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookup by date
CREATE INDEX idx_notification_prefs_date ON notification_preferences(date_key);

-- Enable RLS but allow all operations (single-user app)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on push_subscriptions" ON push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on notification_preferences" ON notification_preferences
  FOR ALL USING (true) WITH CHECK (true);
