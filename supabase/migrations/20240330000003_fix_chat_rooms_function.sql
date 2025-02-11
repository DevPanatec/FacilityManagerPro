-- Drop all existing versions of the function
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.get_user_chat_rooms(uuid);
    DROP FUNCTION IF EXISTS public.get_user_chat_rooms();
    DROP FUNCTION IF EXISTS public.get_user_chat_rooms(p_user_id uuid);
EXCEPTION 
    WHEN others THEN 
        NULL;
END $$;

-- Create the new function with improved filtering
CREATE OR REPLACE FUNCTION public.get_user_chat_rooms(p_user_id uuid)
RETURNS TABLE (
    room_id uuid,
    room_name text,
    room_type text,
    room_description text,
    last_message jsonb,
    unread_count bigint,
    member_count bigint,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH chat_members AS (
        SELECT 
            cr.id as room_id,
            cr.name as room_name,
            cr.type as room_type,
            cr.description as room_description,
            crm.user_id,
            COUNT(*) OVER (PARTITION BY cr.id) as total_members
        FROM chat_rooms cr
        JOIN chat_room_members crm ON cr.id = crm.room_id
        WHERE cr.status = 'active'
        AND cr.type IN ('direct', 'group')
    ),
    last_messages AS (
        SELECT DISTINCT ON (room_id)
            room_id,
            jsonb_build_object(
                'id', id,
                'content', content,
                'created_at', created_at,
                'sender_id', sender_id
            ) as message_data
        FROM chat_messages
        ORDER BY room_id, created_at DESC
    ),
    unread_counts AS (
        SELECT 
            room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        LEFT JOIN chat_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = p_user_id
        WHERE cmr.id IS NULL AND cm.sender_id != p_user_id
        GROUP BY room_id
    ),
    other_users AS (
        SELECT 
            cm.room_id,
            u.id as other_user_id,
            u.full_name as other_user_name,
            u.avatar_url as other_user_avatar
        FROM chat_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.user_id != p_user_id
        AND cm.room_type = 'direct'
    )
    SELECT 
        cm.room_id,
        cm.room_name,
        cm.room_type,
        cm.room_description,
        COALESCE(lm.message_data, '{}'::jsonb) as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        cm.total_members as member_count,
        ou.other_user_id,
        ou.other_user_name,
        ou.other_user_avatar
    FROM chat_members cm
    LEFT JOIN last_messages lm ON cm.room_id = lm.room_id
    LEFT JOIN unread_counts uc ON cm.room_id = uc.room_id
    LEFT JOIN other_users ou ON cm.room_id = ou.room_id
    WHERE cm.user_id = p_user_id;
END;
$$;

-- Set the appropriate permissions
ALTER FUNCTION public.get_user_chat_rooms(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_user_chat_rooms(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_chat_rooms(uuid) FROM anon; 