-- Fix for existing Supabase database
-- Run this if you already deployed the old schema

-- Step 1: Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop and recreate the handle_new_user function with fixes
DROP FUNCTION IF EXISTS handle_new_user();

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

-- Step 3: Add the service role insert policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Service role can insert profiles'
    ) THEN
        CREATE POLICY "Service role can insert profiles"
            ON profiles FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 5: Verify the setup
SELECT 'Setup complete! Try signing up again.' as status;
