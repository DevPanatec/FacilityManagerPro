-- 1. Primero modificamos los tipos de datos en public.users
ALTER TABLE public.users 
    ALTER COLUMN email TYPE character varying USING email::character varying,
    ALTER COLUMN role TYPE character varying USING role::character varying,
    ALTER COLUMN role SET DEFAULT 'authenticated'::character varying;

-- 2. Sincronizar usuarios existentes
INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at,
    status,
    timezone,
    language
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.role, 'authenticated'),
    au.created_at,
    au.updated_at,
    'active',
    'UTC',
    'es'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Crear o reemplazar la función de sincronización
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        role,
        created_at,
        updated_at,
        status,
        timezone,
        language
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.role, 'authenticated'),
        NEW.created_at,
        NEW.updated_at,
        'active',
        'UTC',
        'es'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error en handle_auth_user_created: %', SQLERRM;
    RAISE EXCEPTION 'Error al crear el perfil de usuario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();

-- 5. Verificar y corregir permisos
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;

-- 6. Agregar comentarios para documentación
COMMENT ON FUNCTION handle_auth_user_created() IS 'Función que sincroniza la creación de usuarios entre auth.users y public.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que maneja la sincronización de usuarios nuevos'; 