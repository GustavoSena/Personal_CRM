-- Add image URL columns to people and companies tables
-- Run this in your Supabase SQL Editor

-- Add avatar_url to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add logo_url to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.people.avatar_url IS 'URL to profile picture/avatar image';
COMMENT ON COLUMN public.companies.logo_url IS 'URL to company logo image';
