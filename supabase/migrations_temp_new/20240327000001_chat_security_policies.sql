-- Eliminar políticas existentes para limpiar
DROP POLICY IF EXISTS "Rooms are viewable by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be updated by admins or owners" ON chat_rooms;
DROP POLICY IF EXISTS "Room members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by room creator or admins" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own status" ON chat_room_members;
DROP POLICY IF EXISTS "Members can leave rooms" ON chat_room_members;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para chat_rooms
CREATE POLICY "Rooms are viewable by organization members"
ON chat_rooms
FOR SELECT
USING (
    auth.role() = 'authenticated' AND
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Rooms can be created by authenticated users"
ON chat_rooms
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Políticas simplificadas para chat_room_members
CREATE POLICY "Members are viewable by organization members"
ON chat_room_members
FOR SELECT
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = room_id
        AND organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Members can be added by room creator"
ON chat_room_members
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = NEW.room_id
        AND created_by = auth.uid()
    )
);

-- Políticas para chat_messages
CREATE POLICY "Messages are viewable by room members"
ON chat_messages
FOR SELECT
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Messages can be sent by room members"
ON chat_messages
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = NEW.room_id
        AND user_id = auth.uid()
    )
);

-- Políticas para chat_message_attachments
CREATE POLICY "Attachments are viewable by room members"
ON chat_message_attachments
FOR SELECT
USING (
    auth.role() = 'authenticated' AND (
        message_id IN (
            SELECT id FROM chat_messages
            WHERE room_id IN (
                SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Attachments can be added by message sender"
ON chat_message_attachments
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND (
        EXISTS (
            SELECT 1 FROM chat_messages
            WHERE id = message_id
            AND user_id = auth.uid()
        )
    )
);

CREATE POLICY "Attachments can be deleted by message sender or admins"
ON chat_message_attachments
FOR DELETE
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (
            SELECT 1 FROM chat_messages m
            WHERE m.id = message_id
            AND (
                m.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM chat_room_members
                    WHERE room_id = m.room_id
                    AND user_id = auth.uid()
                    AND role IN ('owner', 'admin')
                )
            )
        )
    )
);

-- Políticas para chat_message_reactions
CREATE POLICY "Reactions are viewable by room members"
ON chat_message_reactions
FOR SELECT
USING (
    auth.role() = 'authenticated' AND (
        message_id IN (
            SELECT id FROM chat_messages
            WHERE room_id IN (
                SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can add reactions to messages"
ON chat_message_reactions
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND (
        EXISTS (
            SELECT 1 FROM chat_messages
            WHERE id = message_id
            AND room_id IN (
                SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can remove their own reactions"
ON chat_message_reactions
FOR DELETE
USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
); 