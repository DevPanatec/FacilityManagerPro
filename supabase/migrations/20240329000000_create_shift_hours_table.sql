-- Create shift_hours table
CREATE TABLE IF NOT EXISTS shift_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shift_hours ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shift hours are viewable by organization members" ON shift_hours
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Shift hours can be managed by organization members" ON shift_hours
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_shift_hours_updated_at
    BEFORE UPDATE ON shift_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX idx_shift_hours_organization ON shift_hours(organization_id); 