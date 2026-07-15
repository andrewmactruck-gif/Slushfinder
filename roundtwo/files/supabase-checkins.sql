-- ─── Add verification columns to location_submissions ─────────────────────────
ALTER TABLE location_submissions
  ADD COLUMN IF NOT EXISTS verified_by_osm     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS osm_confidence       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS osm_matched_name     TEXT,
  ADD COLUMN IF NOT EXISTS osm_matched_type     TEXT,
  ADD COLUMN IF NOT EXISTS verification_reason  TEXT;

-- ─── Add check-in + rating columns to locations ───────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS checkin_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slush_rating     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slush_tier       TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS last_checkin_at  TIMESTAMPTZ;

-- ─── Checkins table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  machine_condition   TEXT,
  flavours_available  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast duplicate check
CREATE INDEX IF NOT EXISTS idx_checkins_loc_user_time
  ON checkins(location_id, user_id, created_at DESC);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_locations_checkin_count
  ON locations(checkin_count DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a check-in (user_id can be null for anon)
CREATE POLICY IF NOT EXISTS "Public checkin insert"
  ON checkins FOR INSERT TO public WITH CHECK (true);

-- Only the user who checked in can read their own
CREATE POLICY IF NOT EXISTS "User reads own checkins"
  ON checkins FOR SELECT USING (auth.uid() = user_id);

-- ─── Leaderboard view ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW location_leaderboard AS
SELECT
  id, name, city, country_code, brand,
  checkin_count,
  slush_rating,
  slush_tier,
  last_checkin_at,
  RANK() OVER (ORDER BY checkin_count DESC) AS rank
FROM locations
WHERE checkin_count > 0
ORDER BY checkin_count DESC
LIMIT 50;
