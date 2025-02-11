-- Deshabilitar RLS temporalmente
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de mensajes
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

-- Crear política simple para mensajes
CREATE POLICY "chat_messages_policy"
ON chat_messages
FOR ALL
USING (
    -- El usuario puede ver mensajes si:
    user_id = auth.uid() -- Es el autor del mensaje
    OR
    EXISTS ( -- O es miembro de la sala
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
)
WITH CHECK (
    -- El usuario puede insertar/actualizar mensajes si:
    EXISTS ( -- Es miembro activo de la sala
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
);

-- Asegurar que los índices necesarios existen
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_user ON chat_messages(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_user_status ON chat_room_members(room_id, user_id, status);

-- Actualizar estadísticas
ANALYZE chat_messages;
ANALYZE chat_room_members; 