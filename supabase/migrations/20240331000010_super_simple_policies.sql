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

-- Política súper simple para chat_room_members
CREATE POLICY "allow_all_members"
ON chat_room_members
FOR ALL
USING (true)
WITH CHECK (true);

-- Política súper simple para chat_messages
CREATE POLICY "allow_all_messages"
ON chat_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Política súper simple para chat_rooms
CREATE POLICY "allow_all_rooms"
ON chat_rooms
FOR ALL
USING (true)
WITH CHECK (true);

-- Actualizar estadísticas
ANALYZE chat_rooms;
ANALYZE chat_room_members;
ANALYZE chat_messages; 