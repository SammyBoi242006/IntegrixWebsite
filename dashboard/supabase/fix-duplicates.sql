-- Database fix to prevent duplicate call records
-- Run this in Supabase SQL Editor

-- 1. Add vapi_call_id column to calls table if it doesn't exist
ALTER TABLE calls ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;

-- 2. Clean up existing duplicates (optional but recommended)
-- This keeps the most complete record (one with transcript) if possible
DELETE FROM calls a USING calls b 
WHERE a.created_at < b.created_at 
AND a.org_id = b.org_id 
AND a.assistant_name = b.assistant_name 
AND (a.vapi_call_id = b.vapi_call_id OR (a.vapi_call_id IS NULL AND b.vapi_call_id IS NULL AND a.start_time = b.start_time));

-- 3. Add unique constraint to vapi_call_id (after cleanup)
-- Note: If you have existing data without vapi_call_id, you might need to handle NULLs
ALTER TABLE calls ADD CONSTRAINT unique_vapi_call_id UNIQUE (vapi_call_id);

SELECT 'Cleanup and schema update complete!' as status;
