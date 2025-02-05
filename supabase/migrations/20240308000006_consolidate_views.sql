-- Drop existing views
DROP VIEW IF EXISTS contingency_creators;
DROP VIEW IF EXISTS contingency_assignees;

-- Create consolidated view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    first_name,
    last_name
FROM auth.users;

-- Grant permissions
GRANT SELECT ON user_profiles TO authenticated; 