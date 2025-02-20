-- Agregar restricciones de clave foránea para organization_id
ALTER TABLE inventory_usage
ADD CONSTRAINT inventory_usage_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

ALTER TABLE inventory_restock
ADD CONSTRAINT inventory_restock_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE CASCADE;

-- Asegurar que inventory_id referencia a inventory_items
ALTER TABLE inventory_usage
DROP CONSTRAINT IF EXISTS inventory_usage_inventory_id_fkey,
ADD CONSTRAINT inventory_usage_inventory_id_fkey
FOREIGN KEY (inventory_id)
REFERENCES inventory_items(id)
ON DELETE CASCADE;

ALTER TABLE inventory_restock
DROP CONSTRAINT IF EXISTS inventory_restock_inventory_id_fkey,
ADD CONSTRAINT inventory_restock_inventory_id_fkey
FOREIGN KEY (inventory_id)
REFERENCES inventory_items(id)
ON DELETE CASCADE; 