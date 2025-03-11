-- Drop duplicate primary key constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

-- Recreate primary key constraints properly
ALTER TABLE auth.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Ensure email uniqueness constraint exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Ensure organization foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES public.organizations(id);

-- Add index on email for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Verify constraints are properly set
COMMENT ON CONSTRAINT users_pkey ON auth.users IS 'Primary key for auth.users';
COMMENT ON CONSTRAINT users_pkey ON public.users IS 'Primary key for public.users';
COMMENT ON CONSTRAINT users_email_key ON public.users IS 'Unique email constraint for public.users';
COMMENT ON CONSTRAINT users_organization_id_fkey ON public.users IS 'Foreign key to organizations table'; 