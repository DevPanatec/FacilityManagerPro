-- Drop ALL existing policies
DROP POLICY IF EXISTS "enable_all_for_members" ON chat_room_members;
DROP POLICY IF EXISTS "enable_all_for_members_messages" ON chat_messages;
DROP POLICY IF EXISTS "members_select" ON chat_room_members;
DROP POLICY IF EXISTS "members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "members_update" ON chat_room_members;
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "messages_update" ON chat_messages;

-- Policies for chat_room_members
CREATE POLICY "crm_select"
ON chat_room_members
FOR SELECT
USING (true);

CREATE POLICY "crm_insert"
ON chat_room_members
FOR INSERT
WITH CHECK (true);

CREATE POLICY "crm_update"
ON chat_room_members
FOR UPDATE
USING (user_id = auth.uid());

-- Policies for chat_messages
CREATE POLICY "cm_select"
ON chat_messages
FOR SELECT
USING (true);

CREATE POLICY "cm_insert"
ON chat_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE user_id = auth.uid()
        AND room_id = chat_messages.room_id
        AND status = 'active'
    )
);

CREATE POLICY "cm_update"
ON chat_messages
FOR UPDATE
USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE chat_room_members FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY; 