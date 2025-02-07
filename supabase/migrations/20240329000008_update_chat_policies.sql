-- Actualizar políticas para chat_rooms
DROP POLICY IF EXISTS "Usuarios pueden ver chats de su organización" ON chat_rooms;
CREATE POLICY "Usuarios pueden ver chats de su organización"
ON chat_rooms
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Actualizar políticas para chat_room_members
DROP POLICY IF EXISTS "Usuarios pueden ver miembros de chats de su organización" ON chat_room_members;
CREATE POLICY "Usuarios pueden ver miembros de chats de su organización"
ON chat_room_members
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar membresías via RPC" ON chat_room_members;
CREATE POLICY "Usuarios pueden insertar membresías via RPC"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar membresías via RPC" ON chat_room_members;
CREATE POLICY "Usuarios pueden actualizar membresías via RPC"
ON chat_room_members
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
); 