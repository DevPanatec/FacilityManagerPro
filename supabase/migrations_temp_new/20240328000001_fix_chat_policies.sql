-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Allow users to send messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Allow users to view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "chat_policy" ON chat_messages;
DROP POLICY IF EXISTS "Enviar mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Leer mensajes" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden insertar mensajes en sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden ver sus mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios mensajes" ON chat_messages;

DROP POLICY IF EXISTS "Actualizar last_read" ON chat_room_members;
DROP POLICY IF EXISTS "Agregar miembros" ON chat_room_members;
DROP POLICY IF EXISTS "Allow users to join chat rooms" ON chat_room_members;
DROP POLICY IF EXISTS "Allow users to update their last read status" ON chat_room_members;
DROP POLICY IF EXISTS "Allow users to update their own last read" ON chat_room_members;
DROP POLICY IF EXISTS "Allow users to view their chat room members" ON chat_room_members;
DROP POLICY IF EXISTS "Enterprise: Añadir admins de su organización" ON chat_room_members;
DROP POLICY IF EXISTS "members_select_policy" ON chat_room_members;
DROP POLICY IF EXISTS "members_update_policy" ON chat_room_members;
DROP POLICY IF EXISTS "Users can update their memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Users can view room members" ON chat_room_members;
DROP POLICY IF EXISTS "Users can view their memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su estado de lectura" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden eliminar miembros de sus salas" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden insertar miembros en sus salas" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden ver miembros de sus salas" ON chat_room_members;
DROP POLICY IF EXISTS "Ver miembros" ON chat_room_members;

DROP POLICY IF EXISTS "Acceso a salas" ON chat_rooms;
DROP POLICY IF EXISTS "Actualizar ultimo mensaje" ON chat_rooms;
DROP POLICY IF EXISTS "Allow users to view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Crear salas" ON chat_rooms;
DROP POLICY IF EXISTS "Enterprise: Crear chats en su organización" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON chat_rooms;

-- Habilitar RLS en todas las tablas
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_messages
CREATE POLICY "messages_select"
ON chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "messages_insert"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = NEW.room_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "messages_update"
ON chat_messages FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "messages_delete"
ON chat_messages FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);

-- Políticas para chat_room_members
CREATE POLICY "members_select"
ON chat_room_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        JOIN users u ON u.organization_id = cr.organization_id
        WHERE cr.id = chat_room_members.room_id
        AND u.id = auth.uid()
    )
);

CREATE POLICY "members_insert"
ON chat_room_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        JOIN users u ON u.organization_id = cr.organization_id
        WHERE cr.id = NEW.room_id
        AND u.id = auth.uid()
    )
);

CREATE POLICY "members_update"
ON chat_room_members FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "members_delete"
ON chat_room_members FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = room_id
        AND created_by = auth.uid()
    )
);

-- Políticas para chat_rooms
CREATE POLICY "rooms_select"
ON chat_rooms FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = chat_rooms.organization_id
    )
);

CREATE POLICY "rooms_insert"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "rooms_update"
ON chat_rooms FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
)
WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "rooms_delete"
ON chat_rooms FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
);

-- Políticas para webhooks y logs (solo accesibles para admins)
CREATE POLICY "webhooks_access"
ON chat_webhooks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "webhook_logs_access"
ON chat_webhook_logs FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
);

-- Habilitar realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE chat_room_members REPLICA IDENTITY FULL;

-- Recrear la publicación de realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    chat_messages,
    chat_rooms,
    chat_room_members
WITH (publish = 'insert,update,delete'); 