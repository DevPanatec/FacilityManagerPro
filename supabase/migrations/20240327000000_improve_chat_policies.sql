-- Add specific policies for enterprise-admin chat
CREATE POLICY "Enterprise can view admin users for chat" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users current_user
            WHERE current_user.id = auth.uid()
            AND current_user.role = 'enterprise'
            AND current_user.organization_id = users.organization_id
        ) AND
        users.role IN ('admin', 'superadmin')
    );

-- Modify the get_or_create_direct_chat function to handle enterprise-admin chat
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(
    p_organization_id UUID,
    p_user_id_1 UUID,
    p_user_id_2 UUID
) RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
    v_user1_role TEXT;
    v_user2_role TEXT;
    v_chat_name TEXT;
BEGIN
    -- Get user roles
    SELECT role INTO v_user1_role FROM users WHERE id = p_user_id_1;
    SELECT role INTO v_user2_role FROM users WHERE id = p_user_id_2;

    -- Verify that at least one user is admin/superadmin if the other is enterprise
    IF (v_user1_role = 'enterprise' AND v_user2_role NOT IN ('admin', 'superadmin')) OR
       (v_user2_role = 'enterprise' AND v_user1_role NOT IN ('admin', 'superadmin')) THEN
        RAISE EXCEPTION 'Enterprise users can only chat with admins';
    END IF;

    -- Check if direct chat already exists
    SELECT r.id INTO v_room_id
    FROM chat_rooms r
    JOIN chat_room_members m1 ON m1.room_id = r.id
    JOIN chat_room_members m2 ON m2.room_id = r.id
    WHERE r.organization_id = p_organization_id
    AND r.type = 'direct'
    AND ((m1.user_id = p_user_id_1 AND m2.user_id = p_user_id_2)
    OR (m1.user_id = p_user_id_2 AND m2.user_id = p_user_id_1));

    -- If not exists, create new direct chat room
    IF v_room_id IS NULL THEN
        -- Get user names for chat name
        SELECT 
            CASE 
                WHEN v_user1_role IN ('admin', 'superadmin') AND v_user2_role = 'enterprise' THEN
                    (SELECT first_name || ' ' || last_name FROM users WHERE id = p_user_id_2)
                WHEN v_user2_role IN ('admin', 'superadmin') AND v_user1_role = 'enterprise' THEN
                    (SELECT first_name || ' ' || last_name FROM users WHERE id = p_user_id_1)
                ELSE 'Chat Directo'
            END INTO v_chat_name;

        -- Create room
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        ) VALUES (
            p_organization_id,
            v_chat_name,
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