-- Drop existing policies for inventory_usage
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_usage;

-- Create new policy for inventory_usage
CREATE POLICY "Enable insert for authenticated users" ON inventory_usage
FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() 
        AND users.organization_id = (
            SELECT organization_id 
            FROM inventory_items 
            WHERE id = inventory_usage.inventory_id
        )
    )
);

-- Enable RLS on inventory_usage table
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY; 