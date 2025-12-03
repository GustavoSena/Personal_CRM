-- =============================================================================
-- Personal CRM Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to create all required tables.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PEOPLE TABLE
-- Stores contact information for individuals
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.people (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_x TEXT,
  telegram TEXT,
  city TEXT,
  country TEXT,
  avatar_url TEXT,
  notes TEXT,
  skills_topics TEXT[] DEFAULT '{}'
);

COMMENT ON TABLE public.people IS 'Contact records for individuals in your network';
COMMENT ON COLUMN public.people.avatar_url IS 'URL to profile picture/avatar image';
COMMENT ON COLUMN public.people.skills_topics IS 'Array of skills, topics, or tags associated with this person';

-- -----------------------------------------------------------------------------
-- COMPANIES TABLE
-- Stores organization/company information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  topics TEXT[] DEFAULT '{}'
);

COMMENT ON TABLE public.companies IS 'Organizations and companies';
COMMENT ON COLUMN public.companies.logo_url IS 'URL to company logo image';
COMMENT ON COLUMN public.companies.topics IS 'Array of topics, industries, or tags associated with this company';

-- -----------------------------------------------------------------------------
-- POSITIONS TABLE
-- Links people to companies with job title and dates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  from_date DATE,
  until_date DATE,
  duration TEXT
);

CREATE INDEX IF NOT EXISTS idx_positions_person_id ON public.positions(person_id);
CREATE INDEX IF NOT EXISTS idx_positions_company_id ON public.positions(company_id);

COMMENT ON TABLE public.positions IS 'Job positions linking people to companies';
COMMENT ON COLUMN public.positions.active IS 'Whether this is the persons current position';
COMMENT ON COLUMN public.positions.duration IS 'Human-readable duration string (e.g., "2 years 3 months")';

-- -----------------------------------------------------------------------------
-- INTERACTIONS TABLE
-- Records meetings, events, and interactions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interactions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  place TEXT,
  description TEXT,
  interaction_date DATE,
  my_position_id INTEGER REFERENCES public.positions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_my_position_id ON public.interactions(my_position_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.interactions(interaction_date);

COMMENT ON TABLE public.interactions IS 'Meetings, events, and interactions with contacts';
COMMENT ON COLUMN public.interactions.my_position_id IS 'References the position you held at the time of this interaction';
COMMENT ON COLUMN public.interactions.interaction_date IS 'Date when the interaction took place';

-- -----------------------------------------------------------------------------
-- INTERACTION_PEOPLE TABLE
-- Many-to-many join table for interactions and people
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interaction_people (
  interaction_id INTEGER NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (interaction_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_interaction_people_person ON public.interaction_people(person_id);

COMMENT ON TABLE public.interaction_people IS 'Links interactions to the people who participated';

-- -----------------------------------------------------------------------------
-- APP_SETTINGS TABLE
-- Application settings (single-user setup)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  my_person_id INTEGER REFERENCES public.people(id) ON DELETE SET NULL
);

-- Insert default settings row (single-user app pattern)
INSERT INTO public.app_settings (my_person_id) 
SELECT NULL 
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

COMMENT ON TABLE public.app_settings IS 'Application settings. In multi-user setup, convert to user_settings with user_id FK';
COMMENT ON COLUMN public.app_settings.my_person_id IS 'The person record representing the app owner/user';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Enable RLS on all tables
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Allow authenticated users full access to people" ON public.people;
DROP POLICY IF EXISTS "Allow authenticated users full access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users full access to positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users full access to interactions" ON public.interactions;
DROP POLICY IF EXISTS "Allow authenticated users full access to interaction_people" ON public.interaction_people;
DROP POLICY IF EXISTS "Allow authenticated users full access to app_settings" ON public.app_settings;

-- Create policies: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to people"
ON public.people FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to companies"
ON public.companies FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to positions"
ON public.positions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to interactions"
ON public.interactions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to interaction_people"
ON public.interaction_people FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to app_settings"
ON public.app_settings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- =============================================================================
-- NOTES
-- =============================================================================
-- This schema is designed for single-user personal CRM usage.
-- For multi-user support, you would need to:
--   1. Add user_id columns to tables
--   2. Update RLS policies to filter by auth.uid()
--   3. Convert app_settings to a user_settings table
-- =============================================================================
