-- Add type_id column to contingencies table
ALTER TABLE contingencies
ADD COLUMN type_id UUID REFERENCES contingency_types(id);

-- Create index for better performance
CREATE INDEX idx_contingencies_type_id ON contingencies(type_id); 