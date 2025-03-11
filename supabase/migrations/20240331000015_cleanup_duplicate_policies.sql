-- First, clean up auth.users policies
DROP POLICY IF EXISTS "Users can view their own data" ON auth.users;
DROP POLICY IF EXISTS "Users can insert records." ON auth.users;
DROP POLICY IF EXISTS "Users can update own records" ON auth.users;
DROP POLICY IF EXISTS "Users can update own records." ON auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON auth.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON auth.users;
DROP POLICY IF EXISTS "Users can insert records" ON auth.users;

-- Create simplified policies for auth.users
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

CREATE POLICY "Users can update own data"
ON auth.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Now, clean up public.users policies
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;

-- Create simplified policies for public.users
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
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 