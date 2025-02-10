-- Deshabilitar RLS temporalmente
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('chat_rooms', 'chat_room_members', 'chat_messages')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política básica para chat_rooms
CREATE POLICY "basic_rooms_policy"
ON chat_rooms
FOR ALL
USING (true)
WITH CHECK (auth.uid() = created_by);

-- Política básica para chat_room_members
CREATE POLICY "basic_members_policy"
ON chat_room_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR
    room_id IN (
        SELECT room_id 
        FROM chat_room_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "basic_members_insert_policy"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "basic_members_update_policy"
ON chat_room_members
FOR UPDATE
USING (user_id = auth.uid());

-- Política básica para chat_messages
CREATE POLICY "basic_messages_policy"
ON chat_messages
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Actualizar estadísticas
ANALYZE chat_rooms;
ANALYZE chat_room_members;
ANALYZE chat_messages; 