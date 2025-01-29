CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organization members can be viewed by organization members"
    ON public.organization_members
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.organization_members 
            WHERE organization_id = organization_members.organization_id
        )
    );

CREATE POLICY "Organization members can be created by organization admins"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.organization_members AS admin_member
            WHERE admin_member.user_id = auth.uid()
            AND admin_member.organization_id = organization_id
            AND admin_member.role = 'admin'
        )
    );

CREATE POLICY "Organization members can be updated by organization admins"
    ON public.organization_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM public.organization_members AS admin_member
            WHERE admin_member.user_id = auth.uid()
            AND admin_member.organization_id = organization_members.organization_id
            AND admin_member.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.organization_members AS admin_member
            WHERE admin_member.user_id = auth.uid()
            AND admin_member.organization_id = organization_id
            AND admin_member.role = 'admin'
        )
    );

CREATE POLICY "Organization members can be deleted by organization admins"
    ON public.organization_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM public.organization_members AS admin_member
            WHERE admin_member.user_id = auth.uid()
            AND admin_member.organization_id = organization_members.organization_id
            AND admin_member.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX idx_organization_members_organization ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);

-- Create updated_at trigger
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 