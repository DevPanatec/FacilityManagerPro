-- Eliminar todas las versiones anteriores de la función
DROP FUNCTION IF EXISTS get_chat_messages(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_room_messages(UUID, INTEGER, INTEGER);

-- Recrear la función con el nombre correcto
CREATE OR REPLACE FUNCTION get_chat_messages(
    p_room_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    room_id UUID,
    organization_id UUID,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar membresía
    IF NOT EXISTS (
        SELECT 1
        FROM chat_room_members
        WHERE room_id = p_room_id
        AND user_id = auth.uid()
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'No tienes acceso a esta sala de chat';
    END IF;

    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.type,
        m.status,
        m.created_at,
        m.updated_at,
        m.user_id,
        m.room_id,
        m.organization_id,
        u.first_name,
        u.last_name,
        u.avatar_url
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.room_id = p_room_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$; 