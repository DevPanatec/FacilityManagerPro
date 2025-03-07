-- Script para la gestión de usuarios en Supabase
-- Este script proporciona funciones para crear y reparar usuarios cuando la interfaz de Supabase no funciona correctamente

-- Función para crear usuarios completos correctamente configurados
CREATE OR REPLACE FUNCTION public.create_full_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- 1. Insertar en auth.users con TODOS los campos importantes
    INSERT INTO auth.users (
        id,
        instance_id,
        email, 
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        aud,
        role,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user,
        email_change_confirm_status,
        confirmed_at
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated',
        jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'email_verified', true,
            'role', p_role
        ),
        false,
        false,
        0,
        NOW()
    );
    
    -- 2. Insertar en public.users con el mismo ID
    INSERT INTO public.users (
        id,
        email, 
        first_name, 
        last_name, 
        role, 
        organization_id,
        status
    ) VALUES (
        new_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_role,
        p_organization_id,
        'active'
    );
    
    RETURN new_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al crear usuario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para corregir usuarios existentes
CREATE OR REPLACE FUNCTION public.fix_user_auth(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id FROM auth.users WHERE email = p_email;
    
    IF user_id IS NULL THEN
        RETURN 'Error: Usuario no encontrado';
    END IF;
    
    -- Actualizar la configuración en auth.users
    UPDATE auth.users
    SET 
        raw_app_meta_data = jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        ),
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change = '',
        email_confirmed_at = NOW(),
        confirmed_at = NOW(),
        is_sso_user = false,
        email_change_confirm_status = 0
    WHERE id = user_id;
    
    RETURN 'Usuario actualizado correctamente: ' || p_email;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error al actualizar usuario: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar el estado de un usuario
CREATE OR REPLACE FUNCTION public.check_user_status(p_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    auth_provider JSONB,
    public_role TEXT,
    exists_in_auth BOOLEAN,
    exists_in_public BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(au.id, pu.id) as id,
        p_email as email,
        au.raw_app_meta_data->'providers' as auth_provider,
        pu.role as public_role,
        (au.id IS NOT NULL) as exists_in_auth,
        (pu.id IS NOT NULL) as exists_in_public
    FROM (SELECT id, raw_app_meta_data FROM auth.users WHERE email = p_email) au
    FULL OUTER JOIN (SELECT id, role FROM public.users WHERE email = p_email) pu
    ON au.id = pu.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSTRUCCIONES DE USO:
/*
-- Para crear un nuevo usuario:
SELECT public.create_full_user(
    'nuevo.usuario@example.com',  -- email
    'Password123!',               -- contraseña
    'Nombre',                     -- nombre
    'Apellido',                   -- apellido
    'admin',                      -- rol (debe ser 'admin' u otro valor permitido)
    '0d7f71d0-1b5f-473f-a3d5-68c3abf99584' -- ID de la organización
);

-- Para reparar un usuario existente:
SELECT public.fix_user_auth('usuario.existente@example.com');

-- Para verificar el estado de un usuario:
SELECT * FROM public.check_user_status('usuario@example.com');
*/ 