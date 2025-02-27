-- Script para eliminar y recrear completamente el usuario admin
-- NOTA: Ejecutar en el Editor SQL de Supabase

-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  new_user_id UUID := uuid_generate_v4();
  org_id UUID := '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'; -- ID de HospitalesGlobales
  user_email VARCHAR := 'alejandro.echevers@hospitalesglobales.com';
BEGIN
  -- 1. Eliminar usuario existente de ambas tablas si existe
  DELETE FROM public.users WHERE email = user_email;
  DELETE FROM auth.users WHERE email = user_email;
  
  -- 2. Crear usuario en auth.users con todas las propiedades necesarias
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    new_user_id,
    user_email,
    -- Contraseña: TemporalPassword123
    '$2a$10$DQYdIJiHokiBLFzOIYw9euMJJUxnfqMNgKXqiB.MLELXVgzR6CcNe',
    now(),
    '',
    now(),
    '',
    null,
    '{"provider":"email","providers":["email"]}',
    '{"firstName":"Alejandro","lastName":"Echevers"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  );
  
  -- 3. Crear registro en tabla users
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
    new_user_id,
    user_email,
    'Alejandro',
    'Echevers',
    'admin',
    org_id,
    'active',
    now(),
    now()
  );
  
  -- 4. Mostrar información del usuario creado
  RAISE NOTICE 'Usuario recreado exitosamente';
  RAISE NOTICE 'ID: %', new_user_id;
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Contraseña: TemporalPassword123';
  RAISE NOTICE 'Rol: admin';
  RAISE NOTICE 'Organización: % (HospitalesGlobales)', org_id;
END
$$; 