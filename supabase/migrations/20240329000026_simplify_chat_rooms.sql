-- Eliminar la función existente
DROP FUNCTION IF EXISTS get_user_chat_rooms();

-- Crear una versión simplificada de la función
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    organization_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.name,
        cr.type,
        cr.organization_id
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    WHERE crm.user_id = auth.uid()
    AND crm.status = 'active';
END;
$$;

-- Asegurar permisos básicos
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO postgres;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Asegurar permisos de tablas
GRANT SELECT ON chat_rooms TO authenticated;
GRANT SELECT ON chat_room_members TO authenticated;

-- Política básica para chat_rooms
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_policy" ON chat_rooms
    FOR ALL
    TO authenticated
    USING (true);

-- Política básica para chat_room_members
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
CREATE POLICY "chat_room_members_policy" ON chat_room_members
    FOR ALL
    TO authenticated
    USING (true); 