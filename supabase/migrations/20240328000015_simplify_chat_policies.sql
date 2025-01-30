-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read for members" ON chat_room_members;
DROP POLICY IF EXISTS "Enable insert for room creators" ON chat_room_members;
DROP POLICY IF EXISTS "Enable update own membership" ON chat_room_members;
DROP POLICY IF EXISTS "Enable read for room members" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert for room members" ON chat_messages;
DROP POLICY IF EXISTS "Enable update for message creators" ON chat_messages;

-- Simple policy for chat_room_members
CREATE POLICY "chat_room_members_policy"
ON chat_room_members
FOR ALL
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_room_members.room_id
        AND chat_rooms.created_by = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_room_members.room_id
        AND chat_rooms.created_by = auth.uid()
    )
);

-- Simple policy for chat_messages
CREATE POLICY "chat_messages_policy"
ON chat_messages
FOR ALL
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.created_by = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.created_by = auth.uid()
    )
);

-- Enable RLS
ALTER TABLE chat_room_members FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY; 