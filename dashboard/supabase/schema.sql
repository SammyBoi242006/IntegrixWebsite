-- VAPI Call Tracking System Database Schema
-- This schema creates all necessary tables, functions, and RLS policies

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores user profile information and maps to VAPI org_id
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    org_id TEXT, -- Maps to VAPI organization ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
-- Stores role assignments for users
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
    ON user_roles FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- CALLS TABLE
-- ============================================================================
-- Stores call data from VAPI webhooks
CREATE TABLE calls (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL,
    assistant_name TEXT,
    assistant_phone_number TEXT,
    customer_phone_number TEXT,
    transcript TEXT,
    call_type TEXT,
    ended_reason TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    cost_usd NUMERIC(10, 4),
    recording_url TEXT, -- URL to the call recording from VAPI artifact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_org_id ON calls(org_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

-- Enable RLS on calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view their own calls"
    ON calls FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calls"
    ON calls FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "System can insert calls"
    ON calls FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, check_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name_value TEXT;
BEGIN
    -- Get display name from metadata or email
    display_name_value := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, display_name_value);
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ADMIN POLICIES (for managing users)
-- ============================================================================

-- Helper function to check if current user is admin
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Allow admins to view all profiles (no recursion)
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id  -- Own profile
        OR 
        -- Direct subquery to avoid recursion
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- Allow admins to update all profiles (no recursion)
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        auth.uid() = id  -- Own profile
        OR 
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- ============================================================================
-- ATTACH TRIGGERS
-- ============================================================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


