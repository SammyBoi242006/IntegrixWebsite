-- Fix for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- Step 2: Recreate admin policies WITHOUT recursion
-- For profiles: admins can view all
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'authenticated'
        AND (
            auth.uid() = id  -- Own profile
            OR 
            -- Check if admin by direct query (no recursion)
            auth.uid() IN (
                SELECT user_id FROM user_roles WHERE role = 'admin'
            )
        )
    );

-- For profiles: admins can update all
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        auth.uid() = id  -- Own profile
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- For user_roles: SIMPLIFIED - no admin check to avoid recursion
-- Admins will need to use service role for role management
-- Or we can create a separate admin function

-- Step 3: Create a helper function for admin operations
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Verify
SELECT 'Policies updated! Try refreshing the page.' as status;
