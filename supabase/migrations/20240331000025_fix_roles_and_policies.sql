-- 1. Primero, sincronizamos los roles de auth.users con public.users
UPDATE auth.users au
SET role = pu.role
FROM public.users pu
WHERE au.id = pu.id;

-- 2. Eliminamos políticas existentes para recrearlas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on role" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.users;

-- 3. Creamos nuevas políticas RLS
-- Política para superadmin: puede ver y modificar todo
CREATE POLICY "Superadmin tiene acceso total" ON public.users
    FOR ALL
    TO authenticated
    USING (auth.jwt()->>'role' = 'superadmin')
    WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- Política para admin: puede ver todo y modificar usuarios de su organización
CREATE POLICY "Admin puede ver todos los usuarios" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admin puede modificar usuarios de su organización" ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        auth.jwt()->>'role' = 'admin' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND organization_id = public.users.organization_id
        )
    );

-- Política para usuarios normales: solo pueden ver y modificar su propio perfil
CREATE POLICY "Usuarios pueden ver y modificar su propio perfil" ON public.users
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Aseguramos que RLS está activado
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- 5. Aseguramos los permisos básicos
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;

-- 6. Actualizamos la función de trigger para mantener la sincronización
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        role,
        created_at,
        updated_at,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.role,
        NEW.created_at,
        NEW.updated_at,
        'active'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error en handle_auth_user_created: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 