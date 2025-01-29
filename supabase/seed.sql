-- Insert test organization
INSERT INTO organizations (id, name, status, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Hombres de Blanco',
  'active',
  NOW(),
  NOW()
);

-- Insert test users in auth.users first
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'admin@test.com', crypt('admin123', gen_salt('bf')), NOW()),
  ('123e4567-e89b-12d3-a456-426614174002', 'user1@test.com', crypt('user123', gen_salt('bf')), NOW()),
  ('123e4567-e89b-12d3-a456-426614174003', 'user2@test.com', crypt('user123', gen_salt('bf')), NOW());

-- Then insert users in public.users
INSERT INTO users (id, email, role, first_name, last_name, organization_id, status, created_at, updated_at)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'admin@test.com', 'admin', 'Admin', 'User', '123e4567-e89b-12d3-a456-426614174000', 'active', NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174002', 'user1@test.com', 'usuario', 'User', 'One', '123e4567-e89b-12d3-a456-426614174000', 'active', NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174003', 'user2@test.com', 'usuario', 'User', 'Two', '123e4567-e89b-12d3-a456-426614174000', 'active', NOW(), NOW());

-- Insert test areas
INSERT INTO areas (id, organization_id, name, status, created_at, updated_at)
VALUES
  ('123e4567-e89b-12d3-a456-426614174004', '123e4567-e89b-12d3-a456-426614174000', 'Área 1', 'active', NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174005', '123e4567-e89b-12d3-a456-426614174000', 'Área 2', 'active', NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174006', '123e4567-e89b-12d3-a456-426614174000', 'Área 3', 'active', NOW(), NOW());

-- Insert test assignments
INSERT INTO assignments (id, organization_id, user_id, area_id, start_time, end_time, status, created_at, updated_at)
VALUES
  (
    '123e4567-e89b-12d3-a456-426614174007',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174002',
    '123e4567-e89b-12d3-a456-426614174004',
    NOW(),
    NOW() + INTERVAL '4 hours',
    'pending',
    NOW(),
    NOW()
  ),
  (
    '123e4567-e89b-12d3-a456-426614174008',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174003',
    '123e4567-e89b-12d3-a456-426614174005',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 8 hours',
    'pending',
    NOW(),
    NOW()
  ); 