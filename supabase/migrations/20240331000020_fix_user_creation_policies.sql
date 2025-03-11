-- Drop only the policies that affect user creation
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Create a new policy specifically for user creation
CREATE POLICY "Enable user creation"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.users TO service_role; 