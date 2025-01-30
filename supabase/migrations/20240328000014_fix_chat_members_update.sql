-- Drop existing policies for chat_room_members
DROP POLICY IF EXISTS "Enable read for organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Enable insert for organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Enable update for own membership" ON chat_room_members;

-- Create new simplified policies for chat_room_members
CREATE POLICY "Enable read for members"
ON chat_room_members
FOR SELECT
USING (
    user_id = auth.uid() OR
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Enable insert for room creators"
ON chat_room_members
FOR INSERT
WITH CHECK (
    room_id IN (
        SELECT id FROM chat_rooms 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Enable update own membership"
ON chat_room_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable RLS
ALTER TABLE chat_room_members FORCE ROW LEVEL SECURITY; 