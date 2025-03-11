-- Drop existing policies on auth.users
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON auth.users;
DROP POLICY IF EXISTS "Users can insert records" ON auth.users;
DROP POLICY IF EXISTS "Users can update own records" ON auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON auth.users;
DROP POLICY IF EXISTS "Users can view their own data" ON auth.users;

-- Create new simplified policies for auth.users
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

-- Drop existing policies on public.users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create new simplified policies for public.users
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (
    -- Users can view their own data
    id = auth.uid()
    OR
    -- Admins can view users in their organization
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
    -- Users can update their own data
    id = auth.uid()
    OR
    -- Admins can update users in their organization
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

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default role if not provided
    IF NEW.role IS NULL THEN
        NEW.role := 'usuario';
    END IF;
    
    -- Set default organization if not provided
    IF NEW.organization_id IS NULL THEN
        -- Try to get organization from the creating user
        SELECT organization_id INTO NEW.organization_id
        FROM public.users
        WHERE id = auth.uid();
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 