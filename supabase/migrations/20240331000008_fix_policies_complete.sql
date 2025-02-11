-- Deshabilitar RLS temporalmente
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DO $$ 
BEGIN
    -- Eliminar políticas de chat_rooms
    DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
    
    -- Eliminar políticas de chat_room_members
    DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_update" ON chat_room_members;
    
    -- Eliminar políticas de chat_messages
    DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
END $$;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para chat_rooms
CREATE POLICY "chat_rooms_policy"
ON chat_rooms
FOR ALL
USING (
    -- El usuario puede acceder a salas de su organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Políticas para chat_room_members
CREATE POLICY "chat_room_members_select"
ON chat_room_members
FOR SELECT
USING (
    -- El usuario puede ver miembros de salas de su organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "chat_room_members_insert"
ON chat_room_members
FOR INSERT
WITH CHECK (
    -- El usuario solo puede insertar miembros en salas donde es admin o owner
    EXISTS (
        SELECT 1 
        FROM chat_room_members admin_check
        WHERE admin_check.room_id = chat_room_members.room_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role IN ('admin', 'owner')
        AND admin_check.status = 'active'
    )
    AND
    -- Y debe ser de la misma organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "chat_room_members_update"
ON chat_room_members
FOR UPDATE
USING (
    -- El usuario puede actualizar su propia membresía
    user_id = auth.uid()
    OR
    -- O es admin/owner de la sala
    EXISTS (
        SELECT 1 
        FROM chat_room_members admin_check
        WHERE admin_check.room_id = chat_room_members.room_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role IN ('admin', 'owner')
        AND admin_check.status = 'active'
    )
);

-- Política para chat_messages
CREATE POLICY "chat_messages_policy"
ON chat_messages
FOR ALL
USING (
    -- El usuario puede ver mensajes de salas donde es miembro
    EXISTS (
        SELECT 1 
        FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
)
WITH CHECK (
    -- Solo puede insertar/actualizar si es miembro activo y es el autor
    user_id = auth.uid()
    AND
    EXISTS (
        SELECT 1 
        FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
);

-- Actualizar estadísticas
ANALYZE chat_rooms;
ANALYZE chat_room_members;
ANALYZE chat_messages;
ANALYZE users; 