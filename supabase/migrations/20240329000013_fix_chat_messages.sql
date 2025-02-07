-- Asegurar que RLS está habilitado
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes en sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden editar sus mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus mensajes" ON chat_messages;

-- Política para ver mensajes
CREATE POLICY "Usuarios pueden ver mensajes de sus chats"
ON chat_messages FOR SELECT TO authenticated
USING (
    room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Política para enviar mensajes
CREATE POLICY "Usuarios pueden enviar mensajes en sus chats"
ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
    room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
    AND user_id = auth.uid()
    AND organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política para editar mensajes
CREATE POLICY "Usuarios pueden editar sus mensajes"
ON chat_messages FOR UPDATE TO authenticated
USING (
    user_id = auth.uid()
    AND room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
)
WITH CHECK (
    user_id = auth.uid()
    AND room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Política para eliminar mensajes
CREATE POLICY "Usuarios pueden eliminar sus mensajes"
ON chat_messages FOR DELETE TO authenticated
USING (
    user_id = auth.uid()
    AND room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Dar permisos a la tabla
GRANT ALL ON chat_messages TO authenticated; 