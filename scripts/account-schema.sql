-- Execute once with DATABASE_URL before enabling accounts.
CREATE TABLE IF NOT EXISTS pathshift_profiles (
  user_id text PRIMARY KEY,
  profile jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- All access is server-only and binds user_id from a verified session.
