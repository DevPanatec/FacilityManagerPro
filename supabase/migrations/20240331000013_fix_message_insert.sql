-- Deshabilitar RLS temporalmente
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "allow_messages_if_member" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
DROP POLICY IF EXISTS "basic_messages_policy" ON chat_messages;

-- Habilitar RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Crear política simple para SELECT
CREATE POLICY "messages_select_policy"
ON chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

-- Crear política simple para INSERT
CREATE POLICY "messages_insert_policy"
ON chat_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

-- Crear política simple para UPDATE
CREATE POLICY "messages_update_policy"
ON chat_messages
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Asegurar índices
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_user ON chat_messages(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_user ON chat_room_members(room_id, user_id);

-- Actualizar estadísticas
ANALYZE chat_messages;
ANALYZE chat_room_members; 