-- Eliminar todas las políticas existentes de chat_room_members
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_update" ON chat_room_members;
DROP POLICY IF EXISTS "enable_all_for_members" ON chat_room_members;
DROP POLICY IF EXISTS "Members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "crm_select" ON chat_room_members;
DROP POLICY IF EXISTS "crm_insert" ON chat_room_members;
DROP POLICY IF EXISTS "crm_update" ON chat_room_members;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Crear nuevas políticas simplificadas
CREATE POLICY "chat_room_members_base_policy"
ON chat_room_members
FOR ALL
USING (
    -- El usuario puede ver/modificar sus propias membresías
    user_id = auth.uid()
    OR
    -- O el usuario pertenece a la misma organización y es miembro de la sala
    (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 
            FROM chat_room_members 
            WHERE room_id = chat_room_members.room_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    )
);

-- Política específica para inserción
CREATE POLICY "chat_room_members_insert_policy"
ON chat_room_members
FOR INSERT
WITH CHECK (
    -- Solo puede insertar si es el creador de la sala o un admin
    EXISTS (
        SELECT 1 
        FROM chat_rooms cr
        WHERE cr.id = room_id
        AND (
            cr.created_by = auth.uid()
            OR
            EXISTS (
                SELECT 1 
                FROM chat_room_members crm
                WHERE crm.room_id = chat_rooms.id
                AND crm.user_id = auth.uid()
                AND crm.role = 'admin'
                AND crm.status = 'active'
            )
        )
    )
    AND
    -- Y el usuario pertenece a la misma organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política específica para actualización
CREATE POLICY "chat_room_members_update_policy"
ON chat_room_members
FOR UPDATE
USING (
    -- Solo puede actualizar su propia membresía
    user_id = auth.uid()
    OR
    -- O es admin de la sala
    EXISTS (
        SELECT 1 
        FROM chat_room_members
        WHERE room_id = chat_room_members.room_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
);

-- Asegurar que los índices existen
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_user ON chat_room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_status ON chat_room_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_org ON chat_room_members(organization_id); 