-- Crear función para asegurar membresía en el chat
CREATE OR REPLACE FUNCTION ensure_chat_membership(
    p_room_id UUID,
    p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_membership RECORD;
    v_is_new BOOLEAN := false;
BEGIN
    -- Obtener el organization_id del usuario
    SELECT organization_id INTO v_organization_id
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Verificar si el chat room existe y pertenece a la misma organización
    IF NOT EXISTS (
        SELECT 1 
        FROM chat_rooms 
        WHERE id = p_room_id 
        AND organization_id = v_organization_id
    ) THEN
        RAISE EXCEPTION 'Chat room no encontrado o no tienes acceso';
    END IF;

    -- Verificar si ya existe una membresía
    SELECT * INTO v_membership
    FROM chat_room_members
    WHERE room_id = p_room_id
    AND user_id = p_user_id;

    -- Si no existe, crear una nueva
    IF NOT FOUND THEN
        INSERT INTO chat_room_members (
            room_id,
            user_id,
            organization_id,
            role,
            status,
            created_by
        )
        VALUES (
            p_room_id,
            p_user_id,
            v_organization_id,
            'member',
            'active',
            p_user_id
        )
        RETURNING * INTO v_membership;
        
        v_is_new := true;
    END IF;

    -- Asegurar que la membresía esté activa
    IF v_membership.status != 'active' THEN
        UPDATE chat_room_members
        SET status = 'active'
        WHERE id = v_membership.id;
        
        v_is_new := true;
    END IF;

    RETURN json_build_object(
        'membership', v_membership,
        'is_new', v_is_new
    );
END;
$$; 