-- Habilitar RLS en la tabla chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes a sus chats" ON chat_messages;

-- Política para leer mensajes
CREATE POLICY "Usuarios pueden ver mensajes de sus chats"
ON chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
);

-- Política para insertar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes a sus chats"
ON chat_messages
FOR INSERT
WITH CHECK (
    -- Verificar que el usuario pertenece al chat room
    EXISTS (
        SELECT 1 
        FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
    -- Verificar que el user_id coincide con el usuario autenticado
    AND auth.uid() = user_id
    -- Verificar que el organization_id coincide con el del usuario
    AND EXISTS (
        SELECT 1 
        FROM users u
        WHERE u.id = auth.uid()
        AND u.organization_id = chat_messages.organization_id
    )
); 