-- Enable necessary extensions for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a function to generate search vectors
CREATE OR REPLACE FUNCTION generate_search_vector(
    title TEXT,
    description TEXT,
    additional_text TEXT DEFAULT NULL
) RETURNS tsvector AS $$
BEGIN
    RETURN (
        setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(additional_text, '')), 'C')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a materialized view for global search
CREATE MATERIALIZED VIEW search_index AS
-- Incidents
SELECT 
    'incident' as entity_type,
    incidents.id as entity_id,
    incidents.organization_id,
    incidents.title,
    incidents.description,
    incidents.status,
    incidents.created_at,
    incidents.updated_at,
    generate_search_vector(
        incidents.title,
        incidents.description,
        incidents.type || ' ' || incidents.severity || ' ' || incidents.status
    ) as search_vector
FROM incidents

UNION ALL

-- Action Plans
SELECT 
    'action_plan' as entity_type,
    action_plans.id as entity_id,
    action_plans.organization_id,
    action_plans.title,
    action_plans.description,
    action_plans.status,
    action_plans.created_at,
    action_plans.updated_at,
    generate_search_vector(
        action_plans.title,
        action_plans.description,
        action_plans.priority || ' ' || action_plans.status
    ) as search_vector
FROM action_plans;

-- Create indexes for the materialized view
CREATE INDEX idx_search_organization ON search_index(organization_id);
CREATE INDEX idx_search_type ON search_index(entity_type);
CREATE INDEX idx_search_vector ON search_index USING gin(search_vector);
CREATE INDEX idx_search_created ON search_index(created_at);
CREATE INDEX idx_search_title_trgm ON search_index USING gin(title gin_trgm_ops);

-- Create a function to refresh the search index
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the search index
CREATE TRIGGER refresh_search_index_incidents
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_search_index();

CREATE TRIGGER refresh_search_index_action_plans
    AFTER INSERT OR UPDATE OR DELETE ON action_plans
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_search_index();

-- Create a function for global search
CREATE OR REPLACE FUNCTION global_search(
    p_organization_id UUID,
    p_query TEXT,
    p_entity_types TEXT[] DEFAULT NULL,
    p_status TEXT[] DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank FLOAT4
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.entity_type,
        s.entity_id,
        s.title,
        s.description,
        s.status,
        s.created_at,
        s.updated_at,
        ts_rank(s.search_vector, to_tsquery('spanish', p_query)) as rank
    FROM search_index s
    WHERE s.organization_id = p_organization_id
    AND (p_entity_types IS NULL OR s.entity_type = ANY(p_entity_types))
    AND (p_status IS NULL OR s.status = ANY(p_status))
    AND (
        p_date_from IS NULL OR 
        s.created_at >= p_date_from
    )
    AND (
        p_date_to IS NULL OR 
        s.created_at <= p_date_to
    )
    AND (
        p_query IS NULL OR 
        s.search_vector @@ to_tsquery('spanish', p_query) OR
        s.title ILIKE '%' || p_query || '%'
    )
    ORDER BY 
        CASE WHEN p_query IS NOT NULL 
            THEN ts_rank(s.search_vector, to_tsquery('spanish', p_query))
            ELSE 0 
        END DESC,
        s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policy for search_index
ALTER MATERIALIZED VIEW search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Search results are visible to organization members" ON search_index
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 