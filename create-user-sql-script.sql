-- =================================================================
-- SCRIPT DE SOLUCIÓN DEFINITIVA PARA CREACIÓN DE USUARIOS EN FACILITYMANAGERPRO
-- =================================================================
-- Este script debe ser ejecutado por un administrador de base de datos
-- con permisos suficientes en la base de datos de Supabase
-- =================================================================

-- 1. Identificar la restricción de clave foránea existente
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint 
  WHERE conrelid = 'public.users'::regclass 
  AND contype = 'f' 
  AND conkey @> ARRAY[1]
  AND confrelid = 'auth.users'::regclass;
  
  RAISE NOTICE 'Restricción identificada: %', constraint_name;
END $$;

-- 2. Eliminar temporalmente la restricción de clave foránea
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Crear una función que maneje la creación sincronizada de usuarios
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

    -- Insertar en auth.users
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        raw_user_meta_data, raw_app_meta_data, 
        is_super_admin, role_id,
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
        false,
        (SELECT id FROM auth.roles WHERE name = 'authenticated'),
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

-- 4. Otorgar permisos para usar la función
GRANT EXECUTE ON FUNCTION create_synchronized_user TO service_role;

-- 5. Crear una API RPC para llamar a la función desde JavaScript
CREATE OR REPLACE FUNCTION create_user_rpc(
    email TEXT,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    organization_id UUID
) RETURNS UUID AS $$
    SELECT create_synchronized_user($1, $2, $3, $4, $5, $6);
$$ LANGUAGE SQL SECURITY DEFINER;

-- 6. Otorgar permisos para usar la función RPC
GRANT EXECUTE ON FUNCTION create_user_rpc TO authenticated;

-- 7. Crear una función para modificar usuarios existentes
CREATE OR REPLACE FUNCTION update_user_data(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := false;
BEGIN
    -- Actualizar en public.users
    UPDATE public.users
    SET 
        email = p_email,
        first_name = p_first_name,
        last_name = p_last_name,
        role = p_role,
        organization_id = p_organization_id,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Actualizar en auth.users
    UPDATE auth.users
    SET 
        email = p_email,
        raw_user_meta_data = jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'role', p_role,
            'organization_id', p_organization_id,
            'email_verified', true,
            'phone_verified', false,
            'verified', true
        ),
        updated_at = now()
    WHERE id = p_user_id;
    
    v_success := true;
    RETURN v_success;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en update_user_data: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Otorgar permisos para usar la función de actualización
GRANT EXECUTE ON FUNCTION update_user_data TO service_role;

-- 9. Crear una API RPC para actualizar usuarios desde JavaScript
CREATE OR REPLACE FUNCTION update_user_rpc(
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    organization_id UUID
) RETURNS BOOLEAN AS $$
    SELECT update_user_data($1, $2, $3, $4, $5, $6);
$$ LANGUAGE SQL SECURITY DEFINER;

-- 10. Otorgar permisos para usar la función RPC de actualización
GRANT EXECUTE ON FUNCTION update_user_rpc TO authenticated;

-- 11. Crear una función para cambiar la contraseña de un usuario
CREATE OR REPLACE FUNCTION reset_user_password(
    p_user_id UUID,
    p_new_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := false;
    v_hashed_password TEXT;
BEGIN
    -- Aplicar el hash a la nueva contraseña
    v_hashed_password := crypt(p_new_password, gen_salt('bf'));
    
    -- Actualizar la contraseña en auth.users
    UPDATE auth.users
    SET 
        encrypted_password = v_hashed_password,
        updated_at = now()
    WHERE id = p_user_id;
    
    v_success := true;
    RETURN v_success;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en reset_user_password: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Otorgar permisos para usar la función de cambio de contraseña
GRANT EXECUTE ON FUNCTION reset_user_password TO service_role;

-- 13. Crear una API RPC para cambiar contraseñas desde JavaScript
CREATE OR REPLACE FUNCTION reset_password_rpc(
    user_id UUID,
    new_password TEXT
) RETURNS BOOLEAN AS $$
    SELECT reset_user_password($1, $2);
$$ LANGUAGE SQL SECURITY DEFINER;

-- 14. Otorgar permisos para usar la función RPC de cambio de contraseña
GRANT EXECUTE ON FUNCTION reset_password_rpc TO authenticated;

-- 15. Crear una función para eliminar usuarios
CREATE OR REPLACE FUNCTION delete_synchronized_user(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := false;
BEGIN
    -- Eliminar de public.users
    DELETE FROM public.users
    WHERE id = p_user_id;
    
    -- Eliminar de auth.users
    DELETE FROM auth.users
    WHERE id = p_user_id;
    
    v_success := true;
    RETURN v_success;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en delete_synchronized_user: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Otorgar permisos para usar la función de eliminación
GRANT EXECUTE ON FUNCTION delete_synchronized_user TO service_role;

-- 17. Crear una API RPC para eliminar usuarios desde JavaScript
CREATE OR REPLACE FUNCTION delete_user_rpc(
    user_id UUID
) RETURNS BOOLEAN AS $$
    SELECT delete_synchronized_user($1);
$$ LANGUAGE SQL SECURITY DEFINER;

-- 18. Otorgar permisos para usar la función RPC de eliminación
GRANT EXECUTE ON FUNCTION delete_user_rpc TO authenticated;

-- =================================================================
-- INSTRUCCIONES FINALES
-- =================================================================
-- 1. Ejecuta este script como superusuario o usuario con permisos suficientes
-- 2. Verifica que todas las funciones se hayan creado correctamente
-- 3. Prueba la función create_user_rpc con un usuario de prueba
-- 4. Si encuentras errores, revisa los mensajes y ajusta el script según sea necesario
-- ================================================================= 