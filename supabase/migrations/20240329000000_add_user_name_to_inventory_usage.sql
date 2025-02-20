-- Add user_name column to inventory_usage if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_usage' 
        AND column_name = 'user_name'
    ) THEN
        ALTER TABLE inventory_usage 
        ADD COLUMN user_name VARCHAR(255);
    END IF;
END $$; 