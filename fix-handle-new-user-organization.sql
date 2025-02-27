-- Script para corregir la función handle_new_user
-- Este script corrige la discrepancia entre los nombres de campos
-- La tabla users tiene organization_id y no hospital_id

-- Eliminar la función y trigger existentes
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Recrear la función con el campo correcto (organization_id)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        role,
        first_name,
        last_name,
        organization_id,
        status
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'organization_id', NULL),
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, users.role),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        organization_id = COALESCE(EXCLUDED.organization_id, users.organization_id),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Mensaje de confirmación
SELECT 'Función handle_new_user actualizada para usar organization_id' as mensaje; 