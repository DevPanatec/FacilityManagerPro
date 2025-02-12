-- Add subarea_id column to contingencies table
ALTER TABLE contingencies
ADD COLUMN IF NOT EXISTS subarea_id UUID REFERENCES subareas(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contingencies_subarea ON contingencies(subarea_id);

-- Update RLS policies to include subarea access
DROP POLICY IF EXISTS "Usuarios pueden ver contingencias de su organización" ON contingencies;
CREATE POLICY "Usuarios pueden ver contingencias de su organización"
  ON contingencies FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      LEFT JOIN areas a ON a.organization_id = u.organization_id
      LEFT JOIN subareas s ON s.area_id = a.id
      WHERE u.organization_id = contingencies.organization_id
      OR a.id = contingencies.area_id
      OR s.id = contingencies.subarea_id
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden crear contingencias en su organización" ON contingencies;
CREATE POLICY "Usuarios pueden crear contingencias en su organización"
  ON contingencies FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      LEFT JOIN areas a ON a.organization_id = u.organization_id
      LEFT JOIN subareas s ON s.area_id = a.id
      WHERE u.organization_id = organization_id
      OR a.id = area_id
      OR s.id = subarea_id
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar contingencias de su organización" ON contingencies;
CREATE POLICY "Usuarios pueden actualizar contingencias de su organización"
  ON contingencies FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      LEFT JOIN areas a ON a.organization_id = u.organization_id
      LEFT JOIN subareas s ON s.area_id = a.id
      WHERE u.organization_id = contingencies.organization_id
      OR a.id = contingencies.area_id
      OR s.id = contingencies.subarea_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      LEFT JOIN areas a ON a.organization_id = u.organization_id
      LEFT JOIN subareas s ON s.area_id = a.id
      WHERE u.organization_id = organization_id
      OR a.id = area_id
      OR s.id = subarea_id
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar contingencias de su organización" ON contingencies;
CREATE POLICY "Usuarios pueden eliminar contingencias de su organización"
  ON contingencies FOR DELETE
  USING (
    auth.uid() IN (
      SELECT u.id 
      FROM users u
      LEFT JOIN areas a ON a.organization_id = u.organization_id
      LEFT JOIN subareas s ON s.area_id = a.id
      WHERE u.organization_id = contingencies.organization_id
      OR a.id = contingencies.area_id
      OR s.id = contingencies.subarea_id
    )
  ); 