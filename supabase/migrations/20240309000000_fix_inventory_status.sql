-- Drop existing constraint
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;

-- Add new constraint with correct values
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_status_check 
CHECK (status IN ('available', 'low', 'out_of_stock'));

-- Update existing records to match new constraint
UPDATE inventory_items 
SET status = CASE 
    WHEN quantity = 0 THEN 'out_of_stock'
    WHEN quantity <= min_stock THEN 'low'
    ELSE 'available'
END; 