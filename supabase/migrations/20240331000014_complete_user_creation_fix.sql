-- First, let's fix auth.users policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON auth.users;
DROP POLICY IF EXISTS "Users can insert records" ON auth.users;
DROP POLICY IF EXISTS "Users can update own records" ON auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON auth.users;
DROP POLICY IF EXISTS "Users can view their own data" ON auth.users;

-- Create simple policies for auth.users
CREATE POLICY "Service role can manage auth users"
ON auth.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own data"
ON auth.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Now, let's fix public.users policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Create simple policies for public.users
CREATE POLICY "Service role can manage public users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM public.users admin_check
        WHERE admin_check.id = auth.uid()
        AND admin_check.role IN ('admin', 'superadmin')
        AND admin_check.organization_id = public.users.organization_id
    )
);

-- Grant necessary permissions
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get the organization_id from the creating user
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

    -- Set default values
    NEW.role := COALESCE(NEW.role, 'usuario');
    NEW.organization_id := COALESCE(NEW.organization_id, org_id);
    NEW.status := COALESCE(NEW.status, 'active');
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.updated_at := COALESCE(NEW.updated_at, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for public.users
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
CREATE TRIGGER on_public_user_created
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on both tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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