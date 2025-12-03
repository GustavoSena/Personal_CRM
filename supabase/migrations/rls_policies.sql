-- Enable Row Level Security on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_people ENABLE ROW LEVEL SECURITY;

-- Create a user_id column for ownership tracking (optional - for multi-user support)
-- For single-user: just allow authenticated users to access all data

-- PEOPLE: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to people"
ON people FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- COMPANIES: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to companies"
ON companies FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- POSITIONS: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to positions"
ON positions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- INTERACTIONS: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to interactions"
ON interactions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- INTERACTION_PEOPLE: Authenticated users can do everything
CREATE POLICY "Allow authenticated users full access to interaction_people"
ON interaction_people FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Deny all access to anonymous users (this is the default when RLS is enabled)
-- The policies above only grant access to authenticated users

-- NOTE: Run this in your Supabase SQL Editor after enabling Auth
-- Go to: Authentication > Providers > Email and enable email auth
-- Set Site URL to your Vercel deployment URL
