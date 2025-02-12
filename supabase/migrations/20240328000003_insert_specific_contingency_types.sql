-- Delete existing contingency types
DELETE FROM contingency_types;

-- Insert the specific contingency types for each organization
INSERT INTO contingency_types (organization_id, name, description, is_active)
SELECT 
    o.id as organization_id,
    t.name,
    t.description,
    true as is_active
FROM organizations o
CROSS JOIN (
    VALUES 
        ('DERRAME DE FLUIDOS', 'Contingencias relacionadas con derrames de fluidos'),
        ('PUNZO CORTANTE', 'Incidentes con objetos punzantes o cortantes'),
        ('DERRAME DE PRODUCTOS O MEDICAMENTOS', 'Derrames específicos de productos o medicamentos'),
        ('PISOS MOJADOS', 'Situaciones de riesgo por pisos mojados'),
        ('DERRAME DE COMIDAS', 'Derrames relacionados con alimentos'),
        ('PISOS Y PAREDES MOJADAS', 'Humedad o agua en pisos y paredes'),
        ('PAPELERIA', 'Incidentes relacionados con documentación o papelería'),
        ('DERRAME DE MEDICAMENTOS', 'Derrames específicos de medicamentos'),
        ('ACCIDENTES', 'Accidentes generales en las instalaciones'),
        ('DESASTRES NATURALES', 'Contingencias causadas por fenómenos naturales'),
        ('QUEMADURA', 'Incidentes relacionados con quemaduras')
) t(name, description)
ON CONFLICT (organization_id, name) DO UPDATE 
SET description = EXCLUDED.description,
    is_active = true; 