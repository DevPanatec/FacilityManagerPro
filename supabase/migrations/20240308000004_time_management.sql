-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_shift_id UUID REFERENCES work_shifts(id) ON DELETE SET NULL,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    check_in_location JSONB,
    check_out_location JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time off requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time off balances table
CREATE TABLE IF NOT EXISTS time_off_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    vacation_days DECIMAL(5,2) DEFAULT 0,
    sick_days DECIMAL(5,2) DEFAULT 0,
    personal_days DECIMAL(5,2) DEFAULT 0,
    used_vacation_days DECIMAL(5,2) DEFAULT 0,
    used_sick_days DECIMAL(5,2) DEFAULT 0,
    used_personal_days DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, year)
);

-- Create overtime records table
CREATE TABLE IF NOT EXISTS overtime_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_shift_id UUID REFERENCES work_shifts(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTERVAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_attendance_organization ON attendance_records(organization_id);
CREATE INDEX idx_attendance_user ON attendance_records(user_id);
CREATE INDEX idx_attendance_work_shift ON attendance_records(work_shift_id);
CREATE INDEX idx_attendance_check_in ON attendance_records(check_in);
CREATE INDEX idx_time_off_requests_organization ON time_off_requests(organization_id);
CREATE INDEX idx_time_off_requests_user ON time_off_requests(user_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_balances_organization ON time_off_balances(organization_id);
CREATE INDEX idx_time_off_balances_user ON time_off_balances(user_id);
CREATE INDEX idx_overtime_organization ON overtime_records(organization_id);
CREATE INDEX idx_overtime_user ON overtime_records(user_id);
CREATE INDEX idx_overtime_work_shift ON overtime_records(work_shift_id);

-- Add triggers for updated_at
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_balances_updated_at
    BEFORE UPDATE ON time_off_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overtime_records_updated_at
    BEFORE UPDATE ON overtime_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_attendance_records_changes
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_time_off_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON time_off_requests
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_time_off_balances_changes
    AFTER INSERT OR UPDATE OR DELETE ON time_off_balances
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_overtime_records_changes
    AFTER INSERT OR UPDATE OR DELETE ON overtime_records
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create notification triggers
CREATE OR REPLACE FUNCTION notify_time_off_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify admins about new time off request
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT 
            NEW.organization_id,
            u.id,
            'Nueva solicitud de tiempo libre',
            'El usuario ' || (SELECT email FROM users WHERE id = NEW.user_id) || 
            ' ha solicitado tiempo libre desde ' || NEW.start_date::date || 
            ' hasta ' || NEW.end_date::date,
            'time_off_request'
        FROM users u
        WHERE u.organization_id = NEW.organization_id
        AND u.role IN ('superadmin', 'admin', 'enterprise');
    
    -- Notify user about request status change
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        VALUES (
            NEW.organization_id,
            NEW.user_id,
            'Estado de solicitud actualizado',
            'Tu solicitud de tiempo libre ha sido ' || NEW.status,
            'time_off_status'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_time_off_request_trigger
    AFTER INSERT OR UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_time_off_request();

-- Create policies for attendance records
CREATE POLICY "Attendance records are viewable by organization members" ON attendance_records
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            attendance_records.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create their own attendance records" ON attendance_records
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        NEW.user_id = auth.uid() AND
        NEW.organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Attendance records can be updated by owners or admins" ON attendance_records
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            attendance_records.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = attendance_records.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for time off requests
CREATE POLICY "Time off requests are viewable by organization members" ON time_off_requests
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            time_off_requests.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create their own time off requests" ON time_off_requests
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        NEW.user_id = auth.uid() AND
        NEW.organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Time off requests can be updated by owners or admins" ON time_off_requests
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            time_off_requests.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = time_off_requests.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for time off balances
CREATE POLICY "Time off balances are viewable by organization members" ON time_off_balances
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            time_off_balances.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Time off balances can be managed by admins" ON time_off_balances
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin', 'enterprise')
            AND (users.organization_id = time_off_balances.organization_id OR users.role = 'superadmin')
        )
    );

-- Create policies for overtime records
CREATE POLICY "Overtime records are viewable by organization members" ON overtime_records
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            overtime_records.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create their own overtime records" ON overtime_records
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        NEW.user_id = auth.uid() AND
        NEW.organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Overtime records can be updated by owners or admins" ON overtime_records
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            overtime_records.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = overtime_records.organization_id OR users.role = 'superadmin')
            )
        )
    ); 