-- Configurar la identidad de réplica para todas las tablas relacionadas
ALTER TABLE work_shifts REPLICA IDENTITY FULL;
ALTER TABLE inventory_items REPLICA IDENTITY FULL;
ALTER TABLE areas REPLICA IDENTITY FULL;
ALTER TABLE documents REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE organizations REPLICA IDENTITY FULL;

-- Borrar solo el turno de prueba que creamos
DELETE FROM work_shifts 
WHERE notes = 'Turno Matutino - 6:00 AM a 2:00 PM'
AND shift_type = 'morning'
AND start_time = '2024-03-20 06:00:00-05'
AND end_time = '2024-03-20 14:00:00-05';

-- Borrar solo la organización de prueba que creamos
DELETE FROM organizations 
WHERE name = 'Organización de Prueba';

-- Verificar los registros eliminados
SELECT * FROM work_shifts WHERE notes = 'Turno Matutino - 6:00 AM a 2:00 PM';
SELECT * FROM organizations WHERE name = 'Organización de Prueba'; 