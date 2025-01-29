-- Insert initial salas
INSERT INTO salas (nombre, descripcion, estado) VALUES
  ('MEDICINA DE VARONES', 'Sala de medicina para pacientes masculinos', true),
  ('MEDICINA DE MUJERES', 'Sala de medicina para pacientes femeninos', true),
  ('CIRUGÍA', 'Sala de cirugía general', true),
  ('ESPECIALIDADES', 'Sala de atención especializada', true),
  ('PEDIATRÍA', 'Sala de atención pediátrica', true),
  ('GINECO OBSTETRICIA', 'Sala de ginecología y obstetricia', true),
  ('PUERPERIO', 'Sala de atención post-parto', true),
  ('SALÓN DE OPERACIONES', 'Sala de operaciones quirúrgicas', true),
  ('PARTO', 'Sala de labor y parto', true),
  ('UCI', 'Unidad de Cuidados Intensivos', true),
  ('RADIOLOGÍA', 'Sala de servicios radiológicos', true),
  ('LABORATORIO', 'Laboratorio clínico', true),
  ('URGENCIAS', 'Sala de atención de emergencias', true)
ON CONFLICT (nombre) DO NOTHING; 