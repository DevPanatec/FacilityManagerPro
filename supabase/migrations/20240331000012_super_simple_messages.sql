-- Deshabilitar RLS temporalmente
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de mensajes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON chat_messages', pol.policyname);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Crear política súper simple para mensajes
CREATE POLICY "allow_messages_if_member"
ON chat_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

-- Asegurar que los índices necesarios existen
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_user ON chat_messages(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_user ON chat_room_members(room_id, user_id);

-- Actualizar estadísticas
ANALYZE chat_messages;
ANALYZE chat_room_members; 