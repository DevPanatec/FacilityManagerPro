-- Script para sincronizar usuarios entre public.users y auth.users
-- Y marcar todos los usuarios como verificados

-- 1. Función para verificar si un usuario existe en auth.users
CREATE OR REPLACE FUNCTION check_user_in_auth(user_uuid UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_uuid
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para insertar usuarios no existentes en auth.users
CREATE OR REPLACE FUNCTION sync_missing_auth_users() 
RETURNS INTEGER AS $$
DECLARE
  counter INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Iterar sobre cada usuario en public.users
  FOR user_record IN 
    SELECT * FROM public.users 
    WHERE email IS NOT NULL 
    AND email != ''
  LOOP
    -- Verificar si el usuario no existe en auth.users
    IF NOT check_user_in_auth(user_record.id) THEN
      -- Insertar en auth.users
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
        user_record.id,
        '00000000-0000-0000-0000-000000000000',
        user_record.email,
        '$2a$10$fgMsRpnSPPMSNxG7GI1T1.fIkDENAQWcP/D5.UG14j5QDM.9o1M4m', -- contraseña genérica: Password123!
        NOW(),
        COALESCE(user_record.created_at, NOW()),
        NOW(),
        jsonb_build_object(
          'first_name', user_record.first_name,
          'last_name', user_record.last_name,
          'email_verified', true,
          'phone_verified', true,
          'verified', true,
          'complete_profile', true
        ),
        jsonb_build_object(
          'provider', 'email',
          'providers', ARRAY['email']::text[],
          'verified', true,
          'role', user_record.role
        ),
        'authenticated',
        user_record.role
      );
      
      counter := counter + 1;
    END IF;
  END LOOP;
  
  RETURN counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para marcar todos los usuarios como verificados en ambas tablas
CREATE OR REPLACE FUNCTION mark_all_users_verified() 
RETURNS INTEGER AS $$
DECLARE
  counter INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Marcar todos los usuarios como verificados en auth.users
  UPDATE auth.users SET
    email_confirmed_at = NOW(),
    raw_user_meta_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{email_verified}', 'true'::jsonb
          ),
          '{phone_verified}', 'true'::jsonb
        ),
        '{verified}', 'true'::jsonb
      ),
      '{complete_profile}', 'true'::jsonb
    ),
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{verified}', 'true'::jsonb
    ),
    updated_at = NOW(),
    confirmation_token = NULL,
    recovery_token = NULL
  WHERE email_confirmed_at IS NULL OR raw_user_meta_data->>'verified' IS NULL OR raw_user_meta_data->>'verified' = 'false';
  
  -- Actualizar contador
  GET DIAGNOSTICS counter = ROW_COUNT;
  
  -- Marcar todos los usuarios como verificados en public.users
  UPDATE public.users SET
    status = 'active',
    updated_at = NOW()
  WHERE status IS NULL OR status != 'active';
  
  RETURN counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ejecutar la sincronización y verificación
DO $$
DECLARE
  sync_count INTEGER;
  verify_count INTEGER;
BEGIN
  -- Primero sincronizar usuarios faltantes
  sync_count := sync_missing_auth_users();
  RAISE NOTICE 'Sincronizados % usuarios desde public.users a auth.users', sync_count;
  
  -- Luego marcar todos como verificados
  verify_count := mark_all_users_verified();
  RAISE NOTICE 'Marcados % usuarios como verificados', verify_count;
  
  -- Mostrar usuarios creados y marcados como verificados
  RAISE NOTICE 'Lista de usuarios sincronizados y verificados:';
  FOR user_record IN 
    SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
           CASE WHEN au.email IS NOT NULL THEN 'SI' ELSE 'NO' END AS en_auth,
           CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'SI' ELSE 'NO' END AS verificado
    FROM public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    ORDER BY u.email
  LOOP
    RAISE NOTICE 'Usuario: % (% %) - Role: % - En Auth: % - Verificado: %', 
      user_record.email, user_record.first_name, user_record.last_name, 
      user_record.role, user_record.en_auth, user_record.verificado;
  END LOOP;
END $$; 