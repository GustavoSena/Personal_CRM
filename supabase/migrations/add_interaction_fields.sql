-- Add interaction_date and my_position_id columns to interactions table
-- Run this migration in your Supabase SQL Editor

ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS interaction_date DATE,
ADD COLUMN IF NOT EXISTS my_position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL;

-- Create index for faster queries by position
CREATE INDEX IF NOT EXISTS idx_interactions_my_position_id ON interactions(my_position_id);

-- Optional: Add a comment to describe the field
COMMENT ON COLUMN interactions.my_position_id IS 'References the position you held at the time of this interaction';
COMMENT ON COLUMN interactions.interaction_date IS 'Date when the interaction took place';

-- ============================================================================
-- App Settings table (for storing user's profile association)
-- In a multi-user future, add user_id column and make it a user_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  my_person_id INTEGER REFERENCES people(id) ON DELETE SET NULL
);

-- Insert a default row (single-user app pattern)
-- This ensures there's always a settings row to update
INSERT INTO app_settings (my_person_id) 
SELECT NULL 
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

COMMENT ON TABLE app_settings IS 'Application settings. In multi-user setup, convert to user_settings with user_id FK';
COMMENT ON COLUMN app_settings.my_person_id IS 'The person record representing the app owner/user';
