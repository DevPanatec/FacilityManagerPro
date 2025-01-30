-- Drop existing policies
DROP POLICY IF EXISTS "Rooms are viewable by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by room members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own status" ON chat_room_members;
DROP POLICY IF EXISTS "Messages are viewable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be created by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be updated by their creators" ON chat_messages;

-- Drop helper function
DROP FUNCTION IF EXISTS check_same_organization;

-- Create simpler policies for chat_rooms
CREATE POLICY "Enable read access for users in same organization"
ON chat_rooms
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable insert for users in same organization"
ON chat_rooms
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Policies for chat_room_members with direct organization check
CREATE POLICY "Enable read for organization members"
ON chat_room_members
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable insert for organization members"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable update for own membership"
ON chat_room_members
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Policies for chat_messages with simplified room membership check
CREATE POLICY "Enable read for room members"
ON chat_messages
FOR SELECT
USING (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Enable insert for room members"
ON chat_messages
FOR INSERT
WITH CHECK (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Enable update for message creators"
ON chat_messages
FOR UPDATE
USING (
    user_id = auth.uid()
); 