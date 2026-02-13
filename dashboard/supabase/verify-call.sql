-- Check if the test call was created
-- Run this in Supabase SQL Editor

-- 1. Check all calls (as service role or admin)
SELECT 
    call_id,
    user_id,
    org_id,
    assistant_name,
    customer_phone_number,
    created_at
FROM calls
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if YOUR user has the matching org_id
SELECT 
    id as user_id,
    email,
    org_id,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- 3. Check if the call's user_id matches your user_id
SELECT 
    c.call_id,
    c.user_id as call_user_id,
    c.org_id as call_org_id,
    p.id as profile_user_id,
    p.email,
    p.org_id as profile_org_id,
    CASE 
        WHEN c.user_id = p.id THEN '✓ MATCH'
        ELSE '✗ MISMATCH'
    END as user_match,
    CASE 
        WHEN c.org_id = p.org_id THEN '✓ MATCH'
        ELSE '✗ MISMATCH'
    END as org_match
FROM calls c
JOIN profiles p ON p.org_id = c.org_id
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Test RLS policy - can you see your own calls?
-- This simulates what the frontend sees
SELECT 
    call_id,
    assistant_name,
    customer_phone_number,
    duration_seconds,
    cost_usd,
    created_at
FROM calls
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
