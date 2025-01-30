-- Drop existing policies
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;

-- Policies for chat_room_members
CREATE POLICY "chat_room_members_select"
ON chat_room_members
FOR SELECT
USING (
    room_id IN (
        SELECT id FROM chat_rooms
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "chat_room_members_insert"
ON chat_room_members
FOR INSERT
WITH CHECK (
    room_id IN (
        SELECT id FROM chat_rooms
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "chat_room_members_update"
ON chat_room_members
FOR UPDATE
USING (user_id = auth.uid());

-- Policies for chat_messages
CREATE POLICY "chat_messages_select"
ON chat_messages
FOR SELECT
USING (
    room_id IN (
        SELECT room_id FROM chat_room_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

CREATE POLICY "chat_messages_insert"
ON chat_messages
FOR INSERT
WITH CHECK (
    room_id IN (
        SELECT room_id FROM chat_room_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

CREATE POLICY "chat_messages_update"
ON chat_messages
FOR UPDATE
USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE chat_room_members FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY; 