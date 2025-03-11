-- Drop existing policies that might interfere with service role
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Create a new policy specifically for service role
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to service role
GRANT ALL ON public.users TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 