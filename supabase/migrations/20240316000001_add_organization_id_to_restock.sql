-- Add organization_id column to inventory_restock if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_restock' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE inventory_restock 
        ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
    END IF;
END $$; 