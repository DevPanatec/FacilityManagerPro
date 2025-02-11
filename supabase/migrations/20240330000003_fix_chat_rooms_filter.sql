-- Eliminar la función existente
DROP FUNCTION IF EXISTS get_user_chat_rooms();

-- Recrear la función con filtro por tipo de chat
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
    member_count BIGINT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    is_group BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
                    'last_name', u.last_name,
                    'avatar_url', u.avatar_url
                )
            ) as message_data
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        ORDER BY cm.room_id, cm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        JOIN chat_room_members crm ON crm.room_id = cm.room_id
        WHERE crm.user_id = auth.uid()
        AND (cm.created_at > crm.last_read_at OR crm.last_read_at IS NULL)
        GROUP BY cm.room_id
    ),
    member_counts AS (
        SELECT 
            crm.room_id,
            COUNT(*) as count
        FROM chat_room_members crm
        WHERE crm.status = 'active'
        GROUP BY crm.room_id
    ),
    other_members AS (
        SELECT 
            crm.room_id,
            u.id as user_id,
            u.first_name || ' ' || u.last_name as full_name,
            u.avatar_url
        FROM chat_room_members crm
        JOIN users u ON u.id = crm.user_id
        WHERE crm.user_id != auth.uid()
        AND crm.status = 'active'
        AND u.role = 'admin'
    )
    SELECT 
        cr.id as room_id,
        CASE 
            WHEN cr.type = 'direct' THEN COALESCE(om.full_name, cr.name)
            ELSE cr.name
        END as room_name,
        cr.type as room_type,
        cr.organization_id,
        cr.created_at,
        cr.updated_at,
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(mc.count, 0) as member_count,
        om.user_id as other_user_id,
        om.full_name as other_user_name,
        om.avatar_url as other_user_avatar,
        cr.type = 'group' as is_group
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    LEFT JOIN last_messages lm ON lm.room_id = cr.id
    LEFT JOIN unread_counts uc ON uc.room_id = cr.id
    LEFT JOIN member_counts mc ON mc.room_id = cr.id
    LEFT JOIN other_members om ON om.room_id = cr.id
    WHERE crm.user_id = auth.uid()
    AND crm.status = 'active'
    AND cr.type IN ('direct', 'group')
    ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC;
END;
$$;

-- Crear función para obtener admins disponibles
CREATE OR REPLACE FUNCTION get_available_admins()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    organization_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.first_name || ' ' || u.last_name as full_name,
        u.avatar_url,
        u.role,
        u.organization_id
    FROM users u
    WHERE u.role = 'admin'
    AND u.organization_id = (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
    AND u.id != auth.uid()
    ORDER BY u.first_name, u.last_name;
END;
$$;

-- Asegurar permisos
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;
REVOKE ALL ON FUNCTION get_available_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_available_admins() TO authenticated; 