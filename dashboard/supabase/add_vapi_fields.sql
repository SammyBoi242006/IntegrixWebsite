-- SQL Migration: Add VAPI Configuration Fields to Profiles Table
-- Run this in your Supabase SQL Editor to ensure all necessary columns exist.

-- Add vapi_api_key if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='vapi_api_key') THEN
        ALTER TABLE profiles ADD COLUMN vapi_api_key TEXT;
    END IF;
END $$;

-- Add vapi_assistant_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='vapi_assistant_id') THEN
        ALTER TABLE profiles ADD COLUMN vapi_assistant_id TEXT;
    END IF;
END $$;

-- Add vapi_phone_number_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='vapi_phone_number_id') THEN
        ALTER TABLE profiles ADD COLUMN vapi_phone_number_id TEXT;
    END IF;
END $$;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('vapi_api_key', 'vapi_assistant_id', 'vapi_phone_number_id');
