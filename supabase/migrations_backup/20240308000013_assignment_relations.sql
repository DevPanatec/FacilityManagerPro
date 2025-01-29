-- Add foreign key relationships for assignments table
ALTER TABLE assignments
  ADD CONSTRAINT fk_assignments_users
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE assignments
  ADD CONSTRAINT fk_assignments_areas
  FOREIGN KEY (area_id)
  REFERENCES areas(id)
  ON DELETE CASCADE;

-- Add relationship definitions for Supabase
COMMENT ON CONSTRAINT fk_assignments_users ON assignments IS
  E'@foreignKey (name: user)\n@mapping (source: user_id, target: id)';

COMMENT ON CONSTRAINT fk_assignments_areas ON assignments IS
  E'@foreignKey (name: area)\n@mapping (source: area_id, target: id)'; 