-- Corregir las políticas para permitir operaciones PATCH en chat_room_members
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios registros" ON chat_room_members;

-- Política para UPDATE
CREATE POLICY "Usuarios pueden actualizar sus propios registros"
ON chat_room_members
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id AND status = 'active')
    OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'superadmin'
    )
);

-- Política específica para permitir que los usuarios actualicen last_read_at
DROP POLICY IF EXISTS "Usuarios pueden marcar como leído" ON chat_room_members;
CREATE POLICY "Usuarios pueden marcar como leído"
ON chat_room_members
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    AND status = 'active'
)
WITH CHECK (
    auth.uid() = user_id
    AND status = 'active'
);

-- Actualizar la función del trigger para manejar last_read_at
CREATE OR REPLACE FUNCTION update_chat_room_member_last_read()
RETURNS TRIGGER AS $$
BEGIN
    -- Siempre actualizamos last_read_at en cualquier UPDATE
    NEW.last_read_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurarnos de que la tabla tiene RLS habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Asegurarnos de que los índices necesarios existen
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_user 
ON chat_room_members(room_id, user_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_status 
ON chat_room_members(user_id, status); 