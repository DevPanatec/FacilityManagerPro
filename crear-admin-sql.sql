-- Script para crear un nuevo usuario administrador
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- Definir variables
DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_email TEXT := 'admin.hospital@facilitymanagerpro.com';
    v_first_name TEXT := 'Admin';
    v_last_name TEXT := 'Hospital';
    v_password TEXT := 'Admin123!'; -- Esta es una contraseña de ejemplo, cámbiala en producción
    v_organization_id UUID := '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
    v_org_exists BOOLEAN;
    v_user_exists BOOLEAN;
BEGIN
    -- Verificar si la organización existe
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = v_organization_id) INTO v_org_exists;
    
    IF NOT v_org_exists THEN
        RAISE EXCEPTION 'La organización con ID % no existe', v_organization_id;
    END IF;
    
    -- Verificar si el usuario ya existe
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = v_email) INTO v_user_exists;
    
    IF v_user_exists THEN
        RAISE EXCEPTION 'Ya existe un usuario con el email %', v_email;
    END IF;
    
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
        v_email,
        -- Contraseña cifrada para 'Admin123!' (hash real de bcrypt)
        '$2a$10$fgMsRpnSPPMSNxG7GI1T1.fIkDENAQWcP/D5.UG14j5QDM.9o1M4m',
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'first_name', v_first_name,
            'last_name', v_last_name,
            'email_verified', true,
            'phone_verified', true,
            'verified', true,
            'complete_profile', true
        ),
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']::text[],
            'role', 'admin'
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
        v_email,
        v_first_name,
        v_last_name,
        'admin',
        v_organization_id,
        'active',
        NOW(),
        NOW()
    );
    
    -- 3. Verificar que el usuario se ha creado correctamente
    RAISE NOTICE 'Usuario creado exitosamente:';
    RAISE NOTICE 'ID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Nombre: % %', v_first_name, v_last_name;
    RAISE NOTICE 'Organización: %', v_organization_id;
    RAISE NOTICE 'Contraseña: %', v_password;
END $$;

-- 4. Consulta para verificar que el usuario existe en ambas tablas
SELECT 
    a.id, 
    a.email AS auth_email, 
    p.email AS public_email,
    p.first_name,
    p.last_name,
    p.role,
    p.organization_id,
    p.status
FROM 
    auth.users a
JOIN 
    public.users p ON a.id = p.id
WHERE 
    a.email = 'admin.hospital@facilitymanagerpro.com'; 