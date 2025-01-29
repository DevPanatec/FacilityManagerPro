-- Insertar webhook de prueba para mensajes
INSERT INTO chat_webhooks (
    organization_id,
    event_type,
    endpoint_url,
    secret_key,
    is_active
) 
SELECT 
    o.id as organization_id,
    'message.created' as event_type,
    'https://webhook.site/' || encode(gen_random_bytes(16), 'hex') as endpoint_url,
    encode(gen_random_bytes(32), 'hex') as secret_key,
    true as is_active
FROM organizations o
WHERE o.id = (SELECT organization_id FROM users WHERE role = 'admin' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Insertar webhook de prueba para salas de chat
INSERT INTO chat_webhooks (
    organization_id,
    event_type,
    endpoint_url,
    secret_key,
    is_active
) 
SELECT 
    o.id as organization_id,
    'room.created' as event_type,
    'https://webhook.site/' || encode(gen_random_bytes(16), 'hex') as endpoint_url,
    encode(gen_random_bytes(32), 'hex') as secret_key,
    true as is_active
FROM organizations o
WHERE o.id = (SELECT organization_id FROM users WHERE role = 'admin' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Insertar webhook de prueba para miembros
INSERT INTO chat_webhooks (
    organization_id,
    event_type,
    endpoint_url,
    secret_key,
    is_active
) 
SELECT 
    o.id as organization_id,
    'member.joined' as event_type,
    'https://webhook.site/' || encode(gen_random_bytes(16), 'hex') as endpoint_url,
    encode(gen_random_bytes(32), 'hex') as secret_key,
    true as is_active
FROM organizations o
WHERE o.id = (SELECT organization_id FROM users WHERE role = 'admin' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Función para probar los webhooks
CREATE OR REPLACE FUNCTION test_webhooks()
RETURNS void AS $$
DECLARE
    v_org_id uuid;
    v_user_id uuid;
BEGIN
    -- Obtener un ID de organización y usuario válidos
    SELECT u.organization_id, u.id 
    INTO STRICT v_org_id, v_user_id
    FROM users u
    WHERE u.role = 'admin' 
    AND u.organization_id IS NOT NULL
    LIMIT 1;

    -- Verificar que tenemos los datos necesarios
    IF v_org_id IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un usuario administrador con organización válida';
    END IF;

    RAISE NOTICE 'Usando organization_id: %, user_id: %', v_org_id, v_user_id;

    -- Crear una sala de chat de prueba
    WITH new_room AS (
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        ) VALUES (
            v_org_id,
            'Sala de prueba webhook',
            'group',
            v_user_id,
            false
        )
        RETURNING id
    )
    -- Insertar un mensaje de prueba
    INSERT INTO chat_messages (
        organization_id,
        room_id,
        user_id,
        content,
        type
    ) 
    SELECT 
        v_org_id,
        new_room.id,
        v_user_id,
        'Mensaje de prueba webhook',
        'text'
    FROM new_room;

    -- Agregar el usuario como miembro de la sala
    INSERT INTO chat_room_members (
        room_id,
        user_id,
        organization_id,
        role
    )
    SELECT 
        r.id,
        v_user_id,
        v_org_id,
        'owner'
    FROM chat_rooms r
    WHERE r.name = 'Sala de prueba webhook'
    AND r.created_by = v_user_id
    AND NOT EXISTS (
        SELECT 1 
        FROM chat_room_members m 
        WHERE m.room_id = r.id 
        AND m.user_id = v_user_id
    );

    RAISE NOTICE 'Webhook de prueba creado exitosamente';
END;
$$ LANGUAGE plpgsql; 