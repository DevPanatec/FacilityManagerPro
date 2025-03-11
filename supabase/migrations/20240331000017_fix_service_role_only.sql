-- First, let's add the service role policy to auth.users
DROP POLICY IF EXISTS "Service role can manage auth users" ON auth.users;
CREATE POLICY "Service role can manage auth users"
ON auth.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Then, let's add the service role policy to public.users
DROP POLICY IF EXISTS "Service role can manage public users" ON public.users;
CREATE POLICY "Service role can manage public users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON public.users TO service_role; 