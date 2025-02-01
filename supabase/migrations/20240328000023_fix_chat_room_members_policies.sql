-- Corregir las políticas de la tabla chat_room_members
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver miembros de sus salas" ON chat_room_members;
CREATE POLICY "Usuarios pueden ver miembros de sus salas"
ON chat_room_members
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT crm.user_id 
    FROM chat_room_members crm 
    WHERE crm.room_id = chat_room_members.room_id 
    AND crm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'superadmin'
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios registros" ON chat_room_members;
CREATE POLICY "Usuarios pueden actualizar sus propios registros"
ON chat_room_members
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'superadmin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'superadmin'
  )
);

-- Función para actualizar last_read_at
CREATE OR REPLACE FUNCTION update_chat_room_member_last_read()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el status cambia a 'read', actualizamos last_read_at
    IF TG_OP = 'UPDATE' AND NEW.status = 'read' AND 
       (OLD.status IS NULL OR OLD.status != 'read') THEN
        NEW.last_read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar last_read_at
DROP TRIGGER IF EXISTS update_chat_room_member_last_read_trigger ON chat_room_members;
CREATE TRIGGER update_chat_room_member_last_read_trigger
    BEFORE UPDATE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_member_last_read(); 