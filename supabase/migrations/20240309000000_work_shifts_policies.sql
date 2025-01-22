-- Habilitar RLS para work_shifts si no está habilitado
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- Políticas para work_shifts
DROP POLICY IF EXISTS "Work shifts are viewable by organization members" ON work_shifts;
DROP POLICY IF EXISTS "Work shifts can be created by organization members" ON work_shifts;
DROP POLICY IF EXISTS "Work shifts can be updated by organization members" ON work_shifts;
DROP POLICY IF EXISTS "Work shifts can be deleted by organization members" ON work_shifts;

CREATE POLICY "Work shifts are viewable by organization members" ON work_shifts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be created by organization members" ON work_shifts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be updated by organization members" ON work_shifts
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be deleted by organization members" ON work_shifts
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 