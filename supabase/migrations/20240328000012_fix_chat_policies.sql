-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Rooms are viewable by organization" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by authenticated users" ON chat_rooms;
DROP POLICY IF EXISTS "Members are viewable by organization" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own data" ON chat_room_members;
DROP POLICY IF EXISTS "Messages are viewable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be created by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be updated by their creators" ON chat_messages;

-- Crear función auxiliar para verificar pertenencia a organización
CREATE OR REPLACE FUNCTION check_same_organization(user_org_id UUID, target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN user_org_id = target_org_id;
END;
$$;

-- Políticas para chat_rooms
CREATE POLICY "Rooms are viewable by organization members"
ON chat_rooms
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND check_same_organization(organization_id, chat_rooms.organization_id)
    )
);

CREATE POLICY "Rooms can be created by organization members"
ON chat_rooms
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND check_same_organization(organization_id, chat_rooms.organization_id)
    )
);

-- Políticas para chat_room_members
CREATE POLICY "Members are viewable by organization members"
ON chat_room_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND check_same_organization(organization_id, chat_room_members.organization_id)
    )
);

CREATE POLICY "Members can be added by room members"
ON chat_room_members
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_room_members crm
        WHERE crm.room_id = chat_room_members.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
);

CREATE POLICY "Members can update their own status"
ON chat_room_members
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Políticas para chat_messages
CREATE POLICY "Messages are viewable by room members"
ON chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
);

CREATE POLICY "Messages can be created by room members"
ON chat_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
);

CREATE POLICY "Messages can be updated by their creators"
ON chat_messages
FOR UPDATE
USING (
    user_id = auth.uid()
); 