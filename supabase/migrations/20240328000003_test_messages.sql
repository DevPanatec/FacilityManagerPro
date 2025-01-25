-- Function to test message sending
CREATE OR REPLACE FUNCTION test_send_message(
    room_id UUID,
    content TEXT DEFAULT 'Test message'
)
RETURNS TABLE (
    success BOOLEAN,
    message_id UUID,
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_message_id UUID;
BEGIN
    -- Get current user
    SELECT id, organization_id INTO v_user_id, v_org_id
    FROM users
    WHERE id = auth.uid();

    -- Verify user is in the room
    IF NOT EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = $1 AND user_id = v_user_id
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'User not in room'::TEXT;
        RETURN;
    END IF;

    -- Send test message
    INSERT INTO chat_messages (
        organization_id,
        room_id,
        user_id,
        content,
        type
    )
    VALUES (
        v_org_id,
        $1,
        v_user_id,
        $2,
        'text'
    )
    RETURNING id INTO v_message_id;

    -- Return success
    RETURN QUERY SELECT true, v_message_id, NULL::TEXT;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$; 