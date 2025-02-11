-- Deshabilitar temporalmente RLS
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
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

-- Eliminar políticas de mensajes
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_base_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "messages_base_policy" ON chat_messages;
DROP POLICY IF EXISTS "allow_messages" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_access" ON chat_messages;

-- Habilitar RLS nuevamente
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Crear una única política para miembros que cubra todas las operaciones
CREATE POLICY "chat_members_access_v2"
ON chat_room_members
FOR ALL
USING (
  -- El usuario puede acceder a sus propias membresías
  user_id = auth.uid()
  OR
  -- O el usuario pertenece a la misma organización Y está en la misma sala
  (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND
    room_id IN (
      SELECT room_id 
      FROM chat_room_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
)
WITH CHECK (
  -- Para inserciones y actualizaciones, el usuario debe pertenecer a la organización
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Crear una única política para mensajes
CREATE POLICY "chat_messages_access_v2"
ON chat_messages
FOR ALL
USING (
  -- El usuario puede acceder a sus propios mensajes
  user_id = auth.uid()
  OR
  -- O el usuario es miembro activo de la sala
  room_id IN (
    SELECT room_id 
    FROM chat_room_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
)
WITH CHECK (
  -- Para inserciones y actualizaciones, el usuario debe ser miembro activo de la sala
  room_id IN (
    SELECT room_id 
    FROM chat_room_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Actualizar estadísticas
ANALYZE chat_room_members;
ANALYZE chat_messages;
ANALYZE users; 