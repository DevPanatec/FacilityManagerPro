-- Drop all existing policies
DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_update" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;

-- Basic policy for chat_room_members
CREATE POLICY "enable_all_for_members"
ON chat_room_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = chat_room_members.organization_id
    )
);

-- Basic policy for chat_messages
CREATE POLICY "enable_all_for_members_messages"
ON chat_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = chat_messages.organization_id
    )
);

-- Enable RLS
ALTER TABLE chat_room_members FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY; 