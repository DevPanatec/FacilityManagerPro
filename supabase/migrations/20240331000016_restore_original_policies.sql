-- First, restore auth.users policies
DROP POLICY IF EXISTS "Service role can manage auth users" ON auth.users;
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;

-- Restore original auth.users policies
CREATE POLICY "Users can view their own data"
ON auth.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert records."
ON auth.users
FOR INSERT
TO anon,authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own records"
ON auth.users
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Users can update own records."
ON auth.users
FOR UPDATE
TO anon,authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can update their own data"
ON auth.users
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON auth.users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users only"
ON auth.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users only"
ON auth.users
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Public users are viewable by everyone"
ON auth.users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public users are viewable by everyone."
ON auth.users
FOR SELECT
TO anon,authenticated
USING (true);

CREATE POLICY "Users can insert records"
ON auth.users
FOR INSERT
TO anon
WITH CHECK (true);

-- Now, restore public.users policies
DROP POLICY IF EXISTS "Service role can manage public users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Restore original public.users policies
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can update own profile only"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Enable read access for authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Restore original permissions
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated; 