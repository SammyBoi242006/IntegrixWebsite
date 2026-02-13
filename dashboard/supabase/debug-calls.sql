-- Debugging Script: Check why calls aren't appearing
-- Run this in Supabase SQL Editor to diagnose the issue

-- Step 1: Check if your profile has an org_id set
SELECT 
    id,
    email,
    org_id,
    created_at
FROM profiles
WHERE id = auth.uid();

-- Step 2: Check if any calls exist in the database
SELECT 
    call_id,
    user_id,
    org_id,
    assistant_name,
    customer_phone_number,
    created_at
FROM calls
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Check if there are calls with YOUR org_id
SELECT 
    call_id,
    org_id,
    assistant_name,
    created_at
FROM calls
WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
ORDER BY created_at DESC;

-- Step 4: Check if there are calls but they're linked to a different user
SELECT 
    c.call_id,
    c.org_id,
    c.user_id,
    p.email as user_email,
    c.created_at
FROM calls c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 5: Check RLS policies on calls table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'calls';

-- Expected results:
-- 1. Your profile should have an org_id
-- 2. If calls exist but you can't see them, it's an RLS issue
-- 3. If no calls exist, the webhook isn't working
-- 4. If calls exist with different org_id, there's a mismatch
