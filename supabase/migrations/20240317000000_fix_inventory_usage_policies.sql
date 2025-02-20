-- Agregar organization_id a inventory_usage si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_usage' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE inventory_usage 
        ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_usage;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_usage;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_restock;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_restock;

-- Create new policies for inventory_usage
CREATE POLICY "Inventory usage records are viewable by organization members" ON inventory_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inventory_items
            JOIN users ON users.organization_id = inventory_items.organization_id
            WHERE inventory_items.id = inventory_usage.inventory_id
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Inventory usage can be created by organization members" ON inventory_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inventory_items
            JOIN users ON users.organization_id = inventory_items.organization_id
            WHERE inventory_items.id = NEW.inventory_id
            AND users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin', 'enterprise')
        )
    );

-- Create new policies for inventory_restock
CREATE POLICY "Inventory restock records are viewable by organization members" ON inventory_restock
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inventory_items
            JOIN users ON users.organization_id = inventory_items.organization_id
            WHERE inventory_items.id = inventory_restock.inventory_id
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Inventory restock can be created by organization members" ON inventory_restock
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inventory_items
            JOIN users ON users.organization_id = inventory_items.organization_id
            WHERE inventory_items.id = NEW.inventory_id
            AND users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin', 'enterprise')
        )
    ); 