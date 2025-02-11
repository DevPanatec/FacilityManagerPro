-- Asegurar que la función get_user_chat_rooms sea accesible
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(UUID) TO authenticated;

-- Asegurar que los usuarios autenticados puedan ver sus propias salas de chat
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat rooms"
ON chat_rooms
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = id
        AND user_id = auth.uid()
        AND status = 'active'
    )
);

-- Asegurar que los usuarios puedan ver los miembros de sus salas
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their chat rooms"
ON chat_room_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members AS my_rooms
        WHERE my_rooms.room_id = chat_room_members.room_id
        AND my_rooms.user_id = auth.uid()
        AND my_rooms.status = 'active'
    )
);

-- Asegurar que los usuarios puedan ver los mensajes de sus salas
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their chat rooms"
ON chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
); 