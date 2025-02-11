-- Agregar nuevos campos a la tabla chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS importance text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reply_to jsonb,
ADD COLUMN IF NOT EXISTS online_status text DEFAULT 'offline';

-- Eliminar restricciones existentes si existen
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_importance_check') THEN
        ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_importance_check;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_online_status_check') THEN
        ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_online_status_check;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_type_check') THEN
        ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_type_check;
    END IF;
END $$;

-- Agregar las restricciones
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_importance_check CHECK (importance IN ('normal', 'urgent', 'important')),
ADD CONSTRAINT chat_messages_online_status_check CHECK (online_status IN ('online', 'offline')),
ADD CONSTRAINT chat_messages_type_check CHECK (type IN ('text', 'image', 'file'));

-- Modificar el tipo de columna
ALTER TABLE chat_messages 
ALTER COLUMN type TYPE text;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_importance ON chat_messages(importance);
CREATE INDEX IF NOT EXISTS idx_chat_messages_online_status ON chat_messages(online_status);

-- Actualizar la función get_chat_messages_v2 para incluir los nuevos campos
CREATE OR REPLACE FUNCTION get_chat_messages_v2(p_room_id UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    room_id UUID,
    organization_id UUID,
    file_url TEXT,
    importance TEXT,
    edited BOOLEAN,
    reactions JSONB,
    reply_to JSONB,
    online_status TEXT,
    users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.type,
        m.status,
        m.created_at,
        m.updated_at,
        m.user_id,
        m.room_id,
        m.organization_id,
        m.file_url,
        m.importance,
        m.edited,
        m.reactions,
        m.reply_to,
        m.online_status,
        jsonb_build_object(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'avatar_url', u.avatar_url
        ) as users
    FROM chat_messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.room_id = p_room_id
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar las políticas de seguridad para los nuevos campos
DROP POLICY IF EXISTS "Enable read access for users in the same organization" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert for users in the same organization" ON chat_messages;

CREATE POLICY "Enable read access for users in the same organization" ON chat_messages
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users in the same organization" ON chat_messages
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Crear una función para actualizar el estado en línea
CREATE OR REPLACE FUNCTION update_user_online_status(p_user_id UUID, p_status TEXT)
RETURNS void AS $$
BEGIN
    UPDATE chat_messages
    SET online_status = p_status
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear una función para obtener el estado en línea de los usuarios
CREATE OR REPLACE FUNCTION get_users_online_status(p_user_ids UUID[])
RETURNS TABLE (
    user_id UUID,
    online_status TEXT,
    last_seen TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (m.user_id)
        m.user_id,
        m.online_status,
        m.updated_at as last_seen
    FROM chat_messages m
    WHERE m.user_id = ANY(p_user_ids)
    ORDER BY m.user_id, m.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 