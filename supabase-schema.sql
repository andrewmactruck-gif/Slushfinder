-- ============================================================
-- Slushy Search — Global Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Locations table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  address          TEXT NOT NULL,
  city             TEXT NOT NULL,
  region           TEXT DEFAULT '',          -- state/province/county
  postal_code      TEXT DEFAULT '',
  country_code     TEXT NOT NULL DEFAULT 'CA', -- ISO 3166-1 alpha-2
  country_name     TEXT NOT NULL DEFAULT 'Canada',
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  geom             GEOGRAPHY(POINT, 4326)
                   GENERATED ALWAYS AS (ST_MakePoint(longitude, latitude)::geography) STORED,
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  brand            TEXT NOT NULL,
  machine_status   TEXT NOT NULL DEFAULT 'operational'
                   CHECK (machine_status IN ('operational','issue_reported','removed')),
  hours            JSONB NOT NULL DEFAULT '{
    "monday":    {"open":"06:00","close":"23:00"},
    "tuesday":   {"open":"06:00","close":"23:00"},
    "wednesday": {"open":"06:00","close":"23:00"},
    "thursday":  {"open":"06:00","close":"23:00"},
    "friday":    {"open":"06:00","close":"00:00"},
    "saturday":  {"open":"07:00","close":"00:00"},
    "sunday":    {"open":"07:00","close":"22:00"}
  }',
  flavours         TEXT,
  conditions       TEXT,    -- JSON array of condition strings
  notes            TEXT,
  phone            TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS locations_geom_idx ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS locations_country_idx ON locations (country_code);
CREATE INDEX IF NOT EXISTS locations_brand_idx ON locations (brand);
CREATE INDEX IF NOT EXISTS locations_status_idx ON locations (machine_status);

-- ── Machine reports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('broken','gone','wrong_info','wrong_hours','other')),
  notes       TEXT,
  resolved    BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_location_idx ON machine_reports (location_id);

-- ── Location submissions (pending review) ───────────────────
CREATE TABLE IF NOT EXISTS location_submissions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  address        TEXT NOT NULL,
  city           TEXT NOT NULL,
  region         TEXT DEFAULT '',
  postal_code    TEXT DEFAULT '',
  country_code   TEXT NOT NULL,
  country_name   TEXT NOT NULL,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  timezone       TEXT DEFAULT 'UTC',
  brand          TEXT NOT NULL,
  flavours       TEXT,
  machine_condition TEXT,
  notes          TEXT,
  machine_status TEXT DEFAULT 'operational',
  review_status  TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Global search function (PostGIS radius) ──────────────────
CREATE OR REPLACE FUNCTION search_locations(
  search_lat     DOUBLE PRECISION,
  search_lng     DOUBLE PRECISION,
  radius_meters  DOUBLE PRECISION DEFAULT 10000
)
RETURNS TABLE (
  id UUID, name TEXT, address TEXT, city TEXT, region TEXT,
  postal_code TEXT, country_code TEXT, country_name TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  timezone TEXT, brand TEXT, machine_status TEXT,
  hours JSONB, flavours TEXT, conditions TEXT, notes TEXT, phone TEXT,
  last_verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
  SELECT
    l.id, l.name, l.address, l.city, l.region,
    l.postal_code, l.country_code, l.country_name,
    l.latitude, l.longitude, l.timezone, l.brand,
    l.machine_status, l.hours, l.flavours, l.conditions, l.notes, l.phone,
    l.last_verified_at, l.created_at, l.updated_at,
    ST_Distance(l.geom, ST_MakePoint(search_lng, search_lat)::geography) AS distance_meters
  FROM locations l
  WHERE
    l.machine_status != 'removed'
    AND ST_DWithin(
      l.geom,
      ST_MakePoint(search_lng, search_lat)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_public_read" ON locations FOR SELECT USING (machine_status != 'removed');
CREATE POLICY "locations_service_write" ON locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "reports_public_insert" ON machine_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_service_read" ON machine_reports FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "submissions_public_insert" ON location_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_service_read" ON location_submissions FOR SELECT USING (auth.role() = 'service_role');

-- ── Auto-update timestamp ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Sample global data ───────────────────────────────────────
INSERT INTO locations (name, address, city, region, postal_code, country_code, country_name, latitude, longitude, timezone, brand, flavours, notes, last_verified_at)
VALUES
  ('7-Eleven — Wellington St', '199 Wellington St W', 'Ottawa', 'ON', 'K1P1H8', 'CA', 'Canada', 45.4215, -75.6972, 'America/Toronto', '7-Eleven', '🍒 Cherry,🫐 Blue Raspberry,🥤 Cola', 'Classic Slurpee machine. Open 24 hours.', now()),
  ('7-Eleven — Times Square', '710 8th Ave', 'New York', 'NY', '10036', 'US', 'United States', 40.7580, -73.9855, 'America/New_York', '7-Eleven', '🍒 Cherry,🫐 Blue Raspberry,🍋 Lemon', 'Busy Midtown location. Multiple machines.', now() - interval '2 days'),
  ('7-Eleven — Shibuya', '21-6 Udagawacho', 'Tokyo', 'Tokyo', '150-0042', 'JP', 'Japan', 35.6608, 139.6988, 'Asia/Tokyo', 'Slurpee Japan', '🍵 Matcha,🍑 Peach,🫐 Blueberry', 'スラーピー available. Multiple flavours.', now() - interval '1 day'),
  ('Circle K — Oxford St', '450 Oxford St', 'London', 'England', 'W1C 1LB', 'GB', 'United Kingdom', 51.5145, -0.1617, 'Europe/London', 'ICEE', '🍓 Strawberry,🫐 Blue Raspberry', 'ICEE machine near the entrance.', now() - interval '3 days'),
  ('7-Eleven — George St', '595 George St', 'Sydney', 'NSW', '2000', 'AU', 'Australia', -33.8766, 151.2065, 'Australia/Sydney', 'Slurpee', '🍒 Cherry,🍊 Orange,🫐 Blue Raspberry', 'Slurpee machine. CBD location.', now() - interval '4 days'),
  ('ICEE — Alexanderplatz', 'Alexanderplatz 1', 'Berlin', 'Berlin', '10178', 'DE', 'Germany', 52.5219, 13.4132, 'Europe/Berlin', 'ICEE', '🍋 Zitrone,🍓 Erdbeere', 'ICEE machine inside the shopping centre.', now() - interval '5 days'),
  ('Slush Puppie — La Défense', '2 Place de la Défense', 'Paris', 'Île-de-France', '92800', 'FR', 'France', 48.8919, 2.2387, 'Europe/Paris', 'Slush Puppie', '🍓 Fraise,🍋 Citron,🍇 Raisin', 'Slush Puppie at the shopping mall.', now() - interval '6 days')
ON CONFLICT DO NOTHING;
