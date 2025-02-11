-- Deshabilitar temporalmente RLS
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
BEGIN
    -- Eliminar políticas de chat_room_members
    DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_base_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_insert_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_update_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_select_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_select_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_insert_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_update_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "allow_select_members" ON chat_room_members;
    DROP POLICY IF EXISTS "allow_insert_members" ON chat_room_members;
    DROP POLICY IF EXISTS "allow_update_members" ON chat_room_members;
    DROP POLICY IF EXISTS "allow_view_members" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_members_access" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_members_access_v2" ON chat_room_members;
    
    -- Eliminar políticas de chat_messages
    DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_base_policy" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
    DROP POLICY IF EXISTS "messages_base_policy" ON chat_messages;
    DROP POLICY IF EXISTS "allow_messages" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_access" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_access_v2" ON chat_messages;
END $$;

-- Habilitar RLS nuevamente
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política simplificada para SELECT en chat_room_members
CREATE POLICY "chat_room_members_select"
ON chat_room_members
FOR SELECT
USING (
    -- El usuario puede ver sus propias membresías
    user_id = auth.uid()
    OR
    -- O el usuario pertenece a la misma organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política simplificada para INSERT en chat_room_members
CREATE POLICY "chat_room_members_insert"
ON chat_room_members
FOR INSERT
WITH CHECK (
    -- El usuario debe pertenecer a la organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política simplificada para UPDATE en chat_room_members
CREATE POLICY "chat_room_members_update"
ON chat_room_members
FOR UPDATE
USING (
    -- Solo puede actualizar sus propias membresías
    user_id = auth.uid()
);

-- Política simplificada para mensajes
CREATE POLICY "chat_messages_policy"
ON chat_messages
FOR ALL
USING (
    -- El usuario puede ver/modificar sus propios mensajes
    user_id = auth.uid()
    OR
    -- O el mensaje está en una sala donde el usuario es miembro
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
)
WITH CHECK (
    -- Solo puede insertar/actualizar si es miembro activo de la sala
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
);

-- Actualizar estadísticas
ANALYZE chat_room_members;
ANALYZE chat_messages;
ANALYZE users; 