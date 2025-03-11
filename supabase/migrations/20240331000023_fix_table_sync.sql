-- Modificar tipos de datos y defaults en public.users
ALTER TABLE public.users 
    ALTER COLUMN email TYPE character varying USING email::character varying,
    ALTER COLUMN role TYPE character varying USING role::character varying,
    ALTER COLUMN role SET DEFAULT 'authenticated'::character varying;

-- Modificar la función handle_auth_user_created para manejar los campos NOT NULL
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

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();

-- Agregar comentarios para documentación
COMMENT ON FUNCTION handle_auth_user_created() IS 'Función que sincroniza la creación de usuarios entre auth.users y public.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que maneja la sincronización de usuarios nuevos'; 