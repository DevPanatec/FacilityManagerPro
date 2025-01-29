-- Create documentation categories table
CREATE TABLE IF NOT EXISTS documentation_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES documentation_categories(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documentation articles table
CREATE TABLE IF NOT EXISTS documentation_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES documentation_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('technical', 'user_guide', 'procedure', 'faq', 'release_note')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published', 'archived')),
    version TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    last_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documentation attachments table
CREATE TABLE IF NOT EXISTS documentation_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES documentation_articles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documentation feedback table
CREATE TABLE IF NOT EXISTS documentation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES documentation_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documentation revisions table
CREATE TABLE IF NOT EXISTS documentation_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES documentation_articles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    change_summary TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documentation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_revisions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_documentation_categories_organization ON documentation_categories(organization_id);
CREATE INDEX idx_documentation_categories_parent ON documentation_categories(parent_id);
CREATE INDEX idx_documentation_articles_organization ON documentation_articles(organization_id);
CREATE INDEX idx_documentation_articles_category ON documentation_articles(category_id);
CREATE INDEX idx_documentation_articles_type ON documentation_articles(type);
CREATE INDEX idx_documentation_articles_status ON documentation_articles(status);
CREATE INDEX idx_documentation_attachments_organization ON documentation_attachments(organization_id);
CREATE INDEX idx_documentation_attachments_article ON documentation_attachments(article_id);
CREATE INDEX idx_documentation_feedback_organization ON documentation_feedback(organization_id);
CREATE INDEX idx_documentation_feedback_article ON documentation_feedback(article_id);
CREATE INDEX idx_documentation_revisions_organization ON documentation_revisions(organization_id);
CREATE INDEX idx_documentation_revisions_article ON documentation_revisions(article_id);

-- Add triggers for updated_at
CREATE TRIGGER update_documentation_categories_updated_at
    BEFORE UPDATE ON documentation_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_articles_updated_at
    BEFORE UPDATE ON documentation_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_attachments_updated_at
    BEFORE UPDATE ON documentation_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_documentation_categories_changes
    AFTER INSERT OR UPDATE OR DELETE ON documentation_categories
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_documentation_articles_changes
    AFTER INSERT OR UPDATE OR DELETE ON documentation_articles
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_article_view_count(
    p_article_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE documentation_articles
    SET view_count = view_count + 1
    WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate article rating
CREATE OR REPLACE FUNCTION get_article_rating(
    p_article_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_rating NUMERIC;
BEGIN
    SELECT AVG(rating)::NUMERIC(3,2) INTO v_rating
    FROM documentation_feedback
    WHERE article_id = p_article_id;
    
    RETURN v_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for documentation categories
CREATE POLICY "Documentation categories are viewable by organization members" ON documentation_categories
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documentation_categories.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Documentation categories can be managed by admins and content managers" ON documentation_categories
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'content_manager')
                AND (users.organization_id = documentation_categories.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for documentation articles
CREATE POLICY "Documentation articles are viewable by organization members" ON documentation_articles
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documentation_articles.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            ) AND
            documentation_articles.status = 'published'
        )
    );

CREATE POLICY "Documentation articles can be managed by admins and content managers" ON documentation_articles
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'content_manager')
                AND (users.organization_id = documentation_articles.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for documentation attachments
CREATE POLICY "Documentation attachments are viewable by organization members" ON documentation_attachments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documentation_attachments.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Documentation attachments can be managed by article authors and admins" ON documentation_attachments
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM documentation_articles a
                WHERE a.id = documentation_attachments.article_id
                AND (
                    a.created_by = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.role IN ('superadmin', 'admin', 'content_manager')
                        AND (users.organization_id = documentation_attachments.organization_id OR users.role = 'superadmin')
                    )
                )
            )
        )
    );

-- Create policies for documentation feedback
CREATE POLICY "Documentation feedback is viewable by organization members" ON documentation_feedback
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documentation_feedback.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Documentation feedback can be created by organization members" ON documentation_feedback
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            documentation_feedback.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create policies for documentation revisions
CREATE POLICY "Documentation revisions are viewable by organization members" ON documentation_revisions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documentation_revisions.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create materialized view for documentation metrics
CREATE MATERIALIZED VIEW documentation_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    type,
    status,
    COUNT(*) as total_articles,
    SUM(view_count) as total_views,
    COUNT(CASE WHEN is_featured THEN 1 END) as featured_articles
FROM documentation_articles
GROUP BY organization_id, DATE_TRUNC('day', created_at), type, status;

-- Create indexes for materialized view
CREATE INDEX idx_documentation_metrics_organization ON documentation_metrics(organization_id);
CREATE INDEX idx_documentation_metrics_date ON documentation_metrics(date);

-- Enable RLS on materialized view
ALTER MATERIALIZED VIEW documentation_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for metrics view
CREATE POLICY "Documentation metrics are viewable by organization members" ON documentation_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 