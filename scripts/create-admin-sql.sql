-- Script SQL para crear un usuario administrador asociado a HospitalesGlobales
-- Este script debe ejecutarse en el editor SQL de Supabase o pgAdmin

-- 1. Crear el usuario en auth.users
-- Nota: Para passwords seguros, Supabase usa criptografía. En este ejemplo usamos un hash de ejemplo.
-- En producción, usa la API de Supabase o el Dashboard para crear usuarios con contraseñas seguras.
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data,
  is_super_admin,
  encrypted_password
) VALUES (
  'alejandro.echevers@hospitalesglobales.com',  -- email
  NOW(),                                        -- email_confirmed_at
  NOW(),                                        -- created_at
  NOW(),                                        -- last_sign_in_at
  '{"firstName":"Alejandro","lastName":"Echevers"}', -- raw_user_meta_data (JSON)
  false,                                        -- is_super_admin
  '$2a$10$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIj' -- encrypted_password (hash de ejemplo)
)
RETURNING id;

-- Nota: Anota el ID devuelto por la consulta anterior para usarlo en el paso siguiente
-- Alternativamente, puedes usar una variable para capturar el ID:

-- 2. Insertar en la tabla users personalizada
-- Reemplaza 'ID_DEL_PASO_ANTERIOR' con el ID devuelto en el paso 1
INSERT INTO public.users (
  id,
  email,
  role,
  first_name,
  last_name,
  organization_id,
  status,
  created_at,
  updated_at
) VALUES (
  'ID_DEL_PASO_ANTERIOR',  -- Reemplaza con el ID real de auth.users
  'alejandro.echevers@hospitalesglobales.com',
  'admin',
  'Alejandro',
  'Echevers',
  '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',  -- ID de HospitalesGlobales
  'active',
  NOW(),
  NOW()
);

-- También puedes hacerlo con una variable en una sola transacción:
/*
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password
  ) VALUES (
    'alejandro.echevers@hospitalesglobales.com',
    NOW(),
    NOW(),
    NOW(),
    '{"firstName":"Alejandro","lastName":"Echevers"}',
    false,
    '$2a$10$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIj'
  )
  RETURNING id INTO new_user_id;

  -- Crear registro en users
  INSERT INTO public.users (
    id,
    email,
    role,
    first_name,
    last_name,
    organization_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'alejandro.echevers@hospitalesglobales.com',
    'admin',
    'Alejandro',
    'Echevers',
    '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
    'active',
    NOW(),
    NOW()
  );
END $$;
*/

-- IMPORTANTE: Después de ejecutar este script, el usuario necesitará resetear su contraseña
-- ya que el hash de contraseña usado es solo un ejemplo y no es válido.
-- Puedes hacerlo desde el Dashboard de Supabase en Authentication > Users 