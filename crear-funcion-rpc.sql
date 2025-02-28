-- Script para crear la función RPC create_user_rpc
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- Primero, verificar y eliminar la función si ya existe
DROP FUNCTION IF EXISTS public.create_user_rpc;

-- Crear la función RPC para crear usuarios
CREATE OR REPLACE FUNCTION public.create_user_rpc(
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_organization_id UUID,
  user_password TEXT,
  user_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_org_exists BOOLEAN;
BEGIN
  -- Verificar si la organización existe
  SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = user_organization_id) INTO v_org_exists;
  
  IF NOT v_org_exists THEN
    RAISE EXCEPTION 'La organización con ID % no existe', user_organization_id;
  END IF;
  
  -- Generar un UUID para el nuevo usuario
  v_user_id := gen_random_uuid();
  
  -- 1. Insertar en auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    -- Contraseña cifrada para la proporcionada (usando un hash genérico aquí)
    -- En producción, deberías usar una función de hash adecuada
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object(
      'first_name', user_first_name,
      'last_name', user_last_name,
      'email_verified', true,
      'phone_verified', true,
      'verified', true,
      'complete_profile', true
    ),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']::text[],
      'role', user_role
    ),
    'authenticated',
    'authenticated'
  );
  
  -- 2. Insertar en public.users
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    organization_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    user_email,
    user_first_name,
    user_last_name,
    user_role,
    user_organization_id,
    'active',
    NOW(),
    NOW()
  );
  
  -- Devolver el ID del usuario creado
  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    RAISE;
END;
$$;

-- Comentario para la función
COMMENT ON FUNCTION public.create_user_rpc IS 'Función segura para crear usuarios tanto en auth.users como en public.users';

-- Otorgar permisos para llamar a la función
GRANT EXECUTE ON FUNCTION public.create_user_rpc TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_rpc TO postgres;

-- Crear otra función RPC para verificar si la función existe
CREATE OR REPLACE FUNCTION public.list_database_functions()
RETURNS TABLE (
  schema_name TEXT,
  function_name TEXT,
  function_arguments TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::TEXT AS schema_name,
    p.proname::TEXT AS function_name,
    pg_get_function_arguments(p.oid)::TEXT AS function_arguments
  FROM 
    pg_proc p
  INNER JOIN 
    pg_namespace n ON p.pronamespace = n.oid
  WHERE 
    n.nspname = 'public'
  ORDER BY 
    schema_name, function_name;
END;
$$;

-- Comentario para la función
COMMENT ON FUNCTION public.list_database_functions IS 'Lista todas las funciones en el esquema public';

-- Otorgar permisos para llamar a la función
GRANT EXECUTE ON FUNCTION public.list_database_functions TO service_role;
GRANT EXECUTE ON FUNCTION public.list_database_functions TO postgres;

-- Probar que la función existe
SELECT * FROM public.list_database_functions();

-- Ejemplo de cómo usar la función create_user_rpc
-- Descomentar para ejecutar:
/*
SELECT create_user_rpc(
  'test.admin@example.com',
  'Test',
  'Admin',
  '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
  'Password123!',
  'admin'
);
*/ 