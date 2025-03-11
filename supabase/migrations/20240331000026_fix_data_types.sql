-- 1. Modificar tipos de datos en public.users para que coincidan con auth.users
ALTER TABLE public.users 
    ALTER COLUMN email TYPE character varying USING email::character varying,
    ALTER COLUMN role TYPE character varying USING role::character varying;

-- 2. Agregar valores por defecto
ALTER TABLE public.users
    ALTER COLUMN role SET DEFAULT 'authenticated'::character varying,
    ALTER COLUMN status SET DEFAULT 'active'::character varying,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

-- 3. Actualizar el trigger para manejar correctamente los tipos de datos
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
        NEW.email::character varying,
        COALESCE(NEW.role, 'authenticated')::character varying,
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now()),
        'active'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error en handle_auth_user_created: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar y actualizar el trigger si es necesario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created(); 