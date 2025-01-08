-- Insertar roles iniciales
INSERT INTO auth.roles (role)
VALUES
  ('superadmin'),
  ('admin'),
  ('enterprise'),
  ('usuario')
ON CONFLICT (role) DO NOTHING;

-- Insertar hospital de prueba
INSERT INTO public.hospitals (
  id,
  name,
  address,
  phone,
  email,
  status,
  created_at,
  updated_at
)
VALUES (
  'f9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
  'Hospital de Prueba',
  'Calle Test 123',
  '+1234567890',
  'hospital@example.com',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario de prueba
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$Q7HSHM.U3HCzHtLQYHE3G.UTJ0KXH/9jkUP/H7HoZc.vmGW9ZCk2W', -- password: test123
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Test", "last_name": "User", "role": "admin", "hospital_id": "f9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insertar usuario en la tabla pública
INSERT INTO public.users (
  id,
  email,
  role,
  first_name,
  last_name,
  status,
  hospital_id,
  created_at,
  updated_at
)
VALUES (
  'c9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
  'test@example.com',
  'admin',
  'Test',
  'User',
  'active',
  'f9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar algunas notificaciones de prueba
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  created_at
)
VALUES
  (
    'c9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
    'welcome',
    'Bienvenido al sistema',
    'Gracias por registrarte en FacilityManagerPro',
    NOW()
  ),
  (
    'c9b06aec-3e3e-4e3e-8e3e-3e3e3e3e3e3e',
    'system',
    'Configuración completada',
    'Tu cuenta ha sido configurada exitosamente',
    NOW()
  ); 