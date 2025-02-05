-- Primero eliminamos las vistas existentes
DROP VIEW IF EXISTS contingency_creators;
DROP VIEW IF EXISTS contingency_assignees;

-- Creamos la nueva vista unificada
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    users.id,
    (users.raw_user_meta_data ->> 'first_name'::text) AS first_name,
    (users.raw_user_meta_data ->> 'last_name'::text) AS last_name
FROM auth.users;

-- Damos permisos de lectura a usuarios autenticados
GRANT SELECT ON user_profiles TO authenticated; 