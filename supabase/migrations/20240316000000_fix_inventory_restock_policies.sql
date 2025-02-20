-- Drop existing policies for inventory_restock
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_restock;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_restock;

-- Create new policies for inventory_restock
CREATE POLICY "Inventory restock records are viewable by organization members" ON inventory_restock
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM inventory_items
                JOIN users ON users.organization_id = inventory_items.organization_id
                WHERE inventory_items.id = inventory_restock.inventory_id
                AND users.id = auth.uid()
            )
        )
    );

CREATE POLICY "Inventory restock can be created by organization members" ON inventory_restock
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM inventory_items
                JOIN users ON users.organization_id = inventory_items.organization_id
                WHERE inventory_items.id = NEW.inventory_id
                AND users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
            )
        )
    ); 