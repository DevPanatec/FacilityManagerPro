-- Corrección de la función de creación de usuarios
-- Basado en el error "column 'role_id' of relation 'users' does not exist"

-- Obtener la estructura de la tabla auth.users para diagnóstico
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY ordinal_position;

-- Corregir la función create_synchronized_user
CREATE OR REPLACE FUNCTION create_synchronized_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_hashed_password TEXT;
BEGIN
    -- Generar un UUID para el nuevo usuario
    v_user_id := gen_random_uuid();
    
    -- Aplicar el hash a la contraseña (usando el método de Supabase)
    v_hashed_password := crypt(p_password, gen_salt('bf'));

    -- Insertar en auth.users (modificado para eliminar role_id)
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        raw_user_meta_data, raw_app_meta_data, 
        -- Eliminamos is_super_admin y role_id que podrían no existir
        created_at, updated_at
    ) VALUES (
        v_user_id, 
        p_email, 
        v_hashed_password, 
        now(),
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'role', p_role,
            'organization_id', p_organization_id,
            'email_verified', true,
            'phone_verified', false,
            'verified', true
        ),
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']
        ),
        -- Eliminamos false y la selección de role_id
        now(), now()
    );

    -- Insertar en public.users
    INSERT INTO public.users (
        id, email, first_name, last_name, role, 
        organization_id, status, created_at, updated_at,
        timezone, language, metadata, failed_login_attempts
    ) VALUES (
        v_user_id, 
        p_email, 
        p_first_name, 
        p_last_name, 
        p_role,
        p_organization_id, 
        'active', 
        now(), 
        now(),
        'UTC', 
        'es', 
        '{}', 
        0
    );

    -- Devolver el ID del usuario creado
    RETURN v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar el error y volver a lanzarlo
        RAISE NOTICE 'Error en create_synchronized_user: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 