-- First, let's check and fix the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Set default values
    NEW.role := COALESCE(NEW.role, 'usuario');
    NEW.status := COALESCE(NEW.status, 'active');
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.updated_at := COALESCE(NEW.updated_at, NOW());

    -- Try to get organization_id from the creating user
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid();

    -- If no organization_id found and the creating user is a superadmin,
    -- create a new organization
    IF org_id IS NULL AND EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    ) THEN
        INSERT INTO public.organizations (name)
        VALUES ('Default Organization')
        RETURNING id INTO org_id;
    END IF;

    -- Set organization_id
    NEW.organization_id := COALESCE(NEW.organization_id, org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for public.users
CREATE TRIGGER on_public_user_created
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Create a function to create the first superadmin if needed
CREATE OR REPLACE FUNCTION public.create_first_superadmin(
    email TEXT,
    password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO public.organizations (name)
    VALUES ('Default Organization')
    RETURNING id INTO org_id;

    -- Create user in auth.users
    INSERT INTO auth.users (email, password, email_confirmed_at)
    VALUES (email, password, NOW())
    RETURNING id INTO user_id;

    -- Create user in public.users
    INSERT INTO public.users (id, email, role, organization_id, status)
    VALUES (user_id, email, 'superadmin', org_id, 'active');

    RETURN user_id;
END;
$$; 