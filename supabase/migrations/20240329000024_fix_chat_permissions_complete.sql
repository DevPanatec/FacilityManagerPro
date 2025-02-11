-- Primero, eliminar la función existente
DROP FUNCTION IF EXISTS get_user_chat_rooms();

-- Recrear la función con los permisos correctos
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message JSONB,
    unread_count BIGINT,
    member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Obtener el ID del usuario actual
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No hay usuario autenticado';
    END IF;

    -- Obtener el ID de la organización del usuario
    SELECT organization_id INTO v_org_id
    FROM users
    WHERE id = v_user_id;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no pertenece a ninguna organización';
    END IF;

    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (cm.room_id)
            cm.room_id,
            jsonb_build_object(
                'id', cm.id,
                'content', cm.content,
                'created_at', cm.created_at,
                'user', jsonb_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name
                )
            ) as message_data
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.organization_id = v_org_id
        ORDER BY cm.room_id, cm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        JOIN chat_room_members crm ON crm.room_id = cm.room_id
        WHERE crm.user_id = v_user_id
        AND crm.organization_id = v_org_id
        AND (cm.created_at > crm.last_read_at OR crm.last_read_at IS NULL)
        GROUP BY cm.room_id
    ),
    member_counts AS (
        SELECT 
            room_id,
            COUNT(*) as count
        FROM chat_room_members
        WHERE organization_id = v_org_id
        AND status = 'active'
        GROUP BY room_id
    )
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type as room_type,
        cr.organization_id,
        cr.created_at,
        cr.updated_at,
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(mc.count, 0) as member_count
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    LEFT JOIN last_messages lm ON lm.room_id = cr.id
    LEFT JOIN unread_counts uc ON uc.room_id = cr.id
    LEFT JOIN member_counts mc ON mc.room_id = cr.id
    WHERE crm.user_id = v_user_id
    AND crm.organization_id = v_org_id
    AND crm.status = 'active'
    AND cr.organization_id = v_org_id
    ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC;
END;
$$;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Revocar todos los permisos existentes
REVOKE ALL ON chat_rooms FROM PUBLIC, authenticated;
REVOKE ALL ON chat_room_members FROM PUBLIC, authenticated;
REVOKE ALL ON chat_messages FROM PUBLIC, authenticated;
REVOKE ALL ON users FROM PUBLIC, authenticated;

-- Otorgar permisos específicos
GRANT SELECT, INSERT, UPDATE ON chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_room_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Revocar permisos de la función y volver a otorgarlos
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Actualizar políticas RLS
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_policy" ON chat_rooms
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
CREATE POLICY "chat_room_members_policy" ON chat_room_members
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
CREATE POLICY "chat_messages_policy" ON chat_messages
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Asegurar que la función tiene acceso a las tablas necesarias
GRANT USAGE ON SCHEMA public TO authenticated;
ALTER FUNCTION get_user_chat_rooms() OWNER TO authenticated; 