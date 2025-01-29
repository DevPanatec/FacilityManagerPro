-- Create chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'channel')),
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat room members table
CREATE TABLE IF NOT EXISTS chat_room_members (
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'file', 'system')),
    parent_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat message reactions table
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, reaction)
);

-- Create chat message attachments table
CREATE TABLE IF NOT EXISTS chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_chat_rooms_organization ON chat_rooms(organization_id);
CREATE INDEX idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX idx_chat_messages_organization ON chat_messages(organization_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_message_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX idx_chat_message_reactions_user ON chat_message_reactions(user_id);
CREATE INDEX idx_chat_message_attachments_organization ON chat_message_attachments(organization_id);
CREATE INDEX idx_chat_message_attachments_message ON chat_message_attachments(message_id);

-- Add triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_room_members_updated_at
    BEFORE UPDATE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_message_attachments_updated_at
    BEFORE UPDATE ON chat_message_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_chat_rooms_changes
    AFTER INSERT OR UPDATE OR DELETE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_chat_messages_changes
    AFTER INSERT OR UPDATE OR DELETE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create notification trigger for chat messages
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
DECLARE
    v_room_name TEXT;
    v_sender_name TEXT;
BEGIN
    -- Get room name
    SELECT name INTO v_room_name
    FROM chat_rooms
    WHERE id = NEW.room_id;

    -- Get sender name
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO v_sender_name
    FROM users
    WHERE id = NEW.user_id;

    -- Notify room members
    INSERT INTO notifications (
        organization_id,
        user_id,
        title,
        message,
        type
    )
    SELECT DISTINCT
        NEW.organization_id,
        m.user_id,
        'Nuevo mensaje en ' || v_room_name,
        v_sender_name || ': ' || substring(NEW.content, 1, 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END,
        'chat_message'
    FROM chat_room_members m
    WHERE m.room_id = NEW.room_id
    AND m.user_id != NEW.user_id
    AND m.last_read_at < NEW.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_chat_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_chat_message();

-- Create function to create or get direct chat room
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(
    p_organization_id UUID,
    p_user_id_1 UUID,
    p_user_id_2 UUID
) RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- Check if direct chat already exists
    SELECT r.id INTO v_room_id
    FROM chat_rooms r
    JOIN chat_room_members m1 ON m1.room_id = r.id
    JOIN chat_room_members m2 ON m2.room_id = r.id
    WHERE r.organization_id = p_organization_id
    AND r.type = 'direct'
    AND m1.user_id = p_user_id_1
    AND m2.user_id = p_user_id_2;

    -- If not exists, create new direct chat room
    IF v_room_id IS NULL THEN
        -- Create room
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        ) VALUES (
            p_organization_id,
            'Direct Chat',
            'direct',
            p_user_id_1,
            true
        ) RETURNING id INTO v_room_id;

        -- Add members
        INSERT INTO chat_room_members (room_id, user_id, role)
        VALUES
            (v_room_id, p_user_id_1, 'member'),
            (v_room_id, p_user_id_2, 'member');
    END IF;

    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for chat rooms
CREATE POLICY "Chat rooms are viewable by members" ON chat_rooms
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Chat rooms can be created by authenticated users" ON chat_rooms
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Create policies for chat_messages
CREATE POLICY "Chat messages are viewable by room members" ON chat_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = chat_messages.room_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in rooms they belong to" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = room_id 
            AND user_id = auth.uid()
        )
    );

-- Create policies for chat_room_members
CREATE POLICY "Room members are viewable by room participants" ON chat_room_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = chat_room_members.room_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Room members can be added by room creator" ON chat_room_members
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE id = room_id 
            AND created_by = auth.uid()
        )
    );

-- Create policies for chat message reactions
CREATE POLICY "Chat message reactions are viewable by room members" ON chat_message_reactions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM chat_messages m
                JOIN chat_room_members rm ON rm.room_id = m.room_id
                WHERE m.id = chat_message_reactions.message_id
                AND rm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Chat message reactions can be managed by room members" ON chat_message_reactions
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM chat_messages m
                JOIN chat_room_members rm ON rm.room_id = m.room_id
                WHERE m.id = chat_message_reactions.message_id
                AND rm.user_id = auth.uid()
            )
        )
    );

-- Create policies for chat message attachments
CREATE POLICY "Chat message attachments are viewable by room members" ON chat_message_attachments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM chat_messages m
                JOIN chat_room_members rm ON rm.room_id = m.room_id
                WHERE m.id = chat_message_attachments.message_id
                AND rm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Chat message attachments can be created by message authors" ON chat_message_attachments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM chat_messages m
                WHERE m.id = NEW.message_id
                AND m.user_id = auth.uid()
            )
        )
    ); 