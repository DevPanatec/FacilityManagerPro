-- Eliminar políticas existentes para limpiar
DROP POLICY IF EXISTS "Rooms are viewable by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be updated by admins or owners" ON chat_rooms;
DROP POLICY IF EXISTS "Room members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by room creator or admins" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own status" ON chat_room_members;
DROP POLICY IF EXISTS "Members can leave rooms" ON chat_room_members;
DROP POLICY IF EXISTS "Messages are viewable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be created by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be updated by their creators" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be deleted by their creators" ON chat_messages;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para chat_rooms
CREATE POLICY "Rooms are viewable by organization members"
ON chat_rooms
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Políticas simplificadas para chat_room_members
CREATE POLICY "Members can do all operations"
ON chat_room_members
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        WHERE cr.id = room_id
        AND cr.organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Políticas para chat_messages
CREATE POLICY "Messages are accessible by room members"
ON chat_messages
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

-- Políticas para chat_message_attachments
CREATE POLICY "Attachments are accessible by room members"
ON chat_message_attachments
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_messages m
        JOIN chat_room_members rm ON m.room_id = rm.room_id
        WHERE m.id = message_id
        AND rm.user_id = auth.uid()
    )
);

-- Políticas para chat_message_reactions
CREATE POLICY "Reactions are accessible by room members"
ON chat_message_reactions
FOR ALL
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_messages m
        JOIN chat_room_members rm ON m.room_id = rm.room_id
        WHERE m.id = message_id
        AND rm.user_id = auth.uid()
    )
); 