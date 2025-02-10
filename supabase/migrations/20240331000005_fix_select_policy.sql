-- Eliminar la política de selección actual
DROP POLICY IF EXISTS "allow_select_members" ON chat_room_members;

-- Crear una política de selección más simple
CREATE POLICY "allow_view_members"
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

-- Asegurar que los índices existen para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_org_id ON chat_room_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);

-- Verificar y actualizar estadísticas
ANALYZE chat_room_members;
ANALYZE users; 