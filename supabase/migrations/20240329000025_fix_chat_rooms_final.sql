-- Primero, eliminar la función existente y sus permisos
DROP FUNCTION IF EXISTS get_user_chat_rooms();
DROP FUNCTION IF EXISTS get_user_chat_rooms(OUT room_id UUID, OUT room_name TEXT, OUT room_type TEXT, OUT organization_id UUID, OUT created_at TIMESTAMPTZ, OUT updated_at TIMESTAMPTZ, OUT last_message JSONB, OUT unread_count BIGINT, OUT member_count BIGINT);

-- Recrear la función con los permisos correctos
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_result json;
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

    FOR v_result IN
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
            json_build_object(
                'room_id', cr.id,
                'room_name', cr.name,
                'room_type', cr.type,
                'organization_id', cr.organization_id,
                'created_at', cr.created_at,
                'updated_at', cr.updated_at,
                'last_message', lm.message_data,
                'unread_count', COALESCE(uc.unread, 0),
                'member_count', COALESCE(mc.count, 0)
            )
        FROM chat_rooms cr
        JOIN chat_room_members crm ON crm.room_id = cr.id
        LEFT JOIN last_messages lm ON lm.room_id = cr.id
        LEFT JOIN unread_counts uc ON uc.room_id = cr.id
        LEFT JOIN member_counts mc ON mc.room_id = cr.id
        WHERE crm.user_id = v_user_id
        AND crm.organization_id = v_org_id
        AND crm.status = 'active'
        AND cr.organization_id = v_org_id
        ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC
    LOOP
        RETURN NEXT v_result;
    END LOOP;

    RETURN;
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

-- Revocar y otorgar permisos de la función
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
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
    );

DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
CREATE POLICY "chat_room_members_policy" ON chat_room_members
    FOR ALL
    TO authenticated
    USING (
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
    );

-- Asegurar que la función tiene acceso a las tablas necesarias
GRANT USAGE ON SCHEMA public TO authenticated; 