-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "messages_update" ON chat_messages;
DROP POLICY IF EXISTS "messages_delete" ON chat_messages;
DROP POLICY IF EXISTS "members_select" ON chat_room_members;
DROP POLICY IF EXISTS "members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "members_update" ON chat_room_members;
DROP POLICY IF EXISTS "members_delete" ON chat_room_members;
DROP POLICY IF EXISTS "rooms_select" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_insert" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_update" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_delete" ON chat_rooms;
DROP POLICY IF EXISTS "webhooks_select" ON chat_webhooks;
DROP POLICY IF EXISTS "webhooks_insert" ON chat_webhooks;
DROP POLICY IF EXISTS "webhooks_update" ON chat_webhooks;
DROP POLICY IF EXISTS "webhooks_delete" ON chat_webhooks;
DROP POLICY IF EXISTS "webhook_logs_select" ON chat_webhook_logs;
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política única para cada tabla
CREATE POLICY "allow_all_authenticated"
ON chat_room_members
FOR ALL
USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "allow_all_authenticated"
ON chat_rooms
FOR ALL
USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "allow_all_authenticated"
ON chat_messages
FOR ALL
USING (
    auth.role() = 'authenticated'
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