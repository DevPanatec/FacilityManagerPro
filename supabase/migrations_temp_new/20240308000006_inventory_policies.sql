-- Inventory items policies
DROP POLICY IF EXISTS "Inventory items are viewable by organization members" ON inventory_items;
DROP POLICY IF EXISTS "Inventory items can be created by admins" ON inventory_items;
DROP POLICY IF EXISTS "Inventory items can be updated by admins" ON inventory_items;

CREATE POLICY "Inventory items are viewable by organization members" ON inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            inventory_items.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Inventory items can be created by admins" ON inventory_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Inventory items can be updated by admins" ON inventory_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = inventory_items.organization_id OR users.role = 'superadmin')
            )
        )
    ); 