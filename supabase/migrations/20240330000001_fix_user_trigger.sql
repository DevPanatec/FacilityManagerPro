-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user in public.users table
    INSERT INTO public.users (
        id,
        email,
        role,
        first_name,
        last_name,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, users.role),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        updated_at = NOW();

    -- Log the synchronization
    INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    )
    VALUES (
        NEW.id,
        CASE WHEN TG_OP = 'INSERT' THEN 'user_created' ELSE 'user_updated' END,
        'users',
        NEW.id,
        jsonb_build_object(
            'email', NEW.email,
            'operation', TG_OP
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user(); 