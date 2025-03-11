-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a function to handle user creation
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can be created by admins" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create new policies for auth.users
CREATE POLICY "Users can view own data"
ON auth.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own data"
ON auth.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Create new policies for public.users
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

CREATE POLICY "Users can be created by admins"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow service role to create users
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Superadmins can create any user
    EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
    )
    OR
    -- Admins can create users in their organization
    EXISTS (
        SELECT 1 
        FROM public.users admin_check
        WHERE admin_check.id = auth.uid()
        AND admin_check.role = 'admin'
        AND admin_check.organization_id = organization_id
    )
);

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
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
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO service_role; 