-- Add total_minutes_limit column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_minutes_limit INTEGER DEFAULT 100;
