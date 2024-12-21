-- Insertar organizaciones de ejemplo
INSERT INTO organizations (nombre, logo_url) VALUES
('Hombres de Blanco', '/logos/hdb-logo.png'),
('Servicio de Seguridad', NULL),
('Servicio de Transporte', NULL);

-- Insertar datos de personal
INSERT INTO staff (organization_id, total_empleados) VALUES
(1, 156),
(2, 234),
(3, 178);

-- Insertar datos de áreas
INSERT INTO areas (organization_id, total_areas) VALUES
(1, 12),
(2, 8),
(3, 6);

-- Insertar datos de actividades
INSERT INTO activities (organization_id, total_actividades, tipo_actividad) VALUES
(1, 1234, 'servicios'),
(2, 892, 'operativos'),
(3, 678, 'servicios');

-- Insertar datos de ingresos
INSERT INTO revenue (organization_id, monto) VALUES
(1, 191100),
(2, 191100),
(3, 191100); 