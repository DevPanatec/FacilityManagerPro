-- Primero eliminamos las vistas existentes
DROP VIEW IF EXISTS contingency_creators;
DROP VIEW IF EXISTS contingency_assignees;

-- Drop existing views
DROP VIEW IF EXISTS user_profiles;

-- Create consolidated view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    role,
    status,
    organization_id
FROM users;

-- Grant permissions
GRANT SELECT ON user_profiles TO authenticated; 