-- First, clean up duplicate service role policies in public.users
DROP POLICY IF EXISTS "Service role can manage public users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Create a single, clear policy for service_role in public.users
CREATE POLICY "Service role can manage public users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure service_role has all necessary permissions
GRANT ALL ON public.users TO service_role;

-- Clean up duplicate policies in auth.users
DROP POLICY IF EXISTS "Users can insert records" ON auth.users;
DROP POLICY IF EXISTS "Users can insert records." ON auth.users;
DROP POLICY IF EXISTS "Users can update own records" ON auth.users;
DROP POLICY IF EXISTS "Users can update own records." ON auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON auth.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON auth.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON auth.users;

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

-- Ensure RLS is enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 