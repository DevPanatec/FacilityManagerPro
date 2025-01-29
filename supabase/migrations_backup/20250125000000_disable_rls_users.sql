-- Disable RLS on users table temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can be created by organization admins" ON public.users;
DROP POLICY IF EXISTS "Users can be updated by organization admins or themselves" ON public.users;

-- Grant full access to authenticated users temporarily
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role; 