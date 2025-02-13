-- Primero eliminamos las restricciones existentes
ALTER TABLE IF EXISTS contingencies
DROP CONSTRAINT IF EXISTS contingencies_created_by_fkey,
DROP CONSTRAINT IF EXISTS contingencies_assigned_to_fkey;

ALTER TABLE IF EXISTS tasks
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey,
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Luego agregamos las nuevas restricciones que apuntan a users
ALTER TABLE contingencies
ADD CONSTRAINT contingencies_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT contingencies_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD CONSTRAINT tasks_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT tasks_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Actualizamos las políticas de seguridad
DROP POLICY IF EXISTS "Usuarios pueden ver contingencias de su organización" ON contingencies;
DROP POLICY IF EXISTS "Usuarios pueden crear contingencias en su organización" ON contingencies;
DROP POLICY IF EXISTS "Usuarios pueden actualizar contingencias de su organización" ON contingencies;
DROP POLICY IF EXISTS "Usuarios pueden eliminar contingencias de su organización" ON contingencies;

CREATE POLICY "Usuarios pueden ver contingencias de su organización"
ON contingencies FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden crear contingencias en su organización"
ON contingencies FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar contingencias de su organización"
ON contingencies FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar contingencias de su organización"
ON contingencies FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
); 