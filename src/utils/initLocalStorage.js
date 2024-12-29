export const getAreas = () => {
  // Retornar las áreas desde localStorage o datos por defecto
  return [
    { id: 1, nombre: 'Área de Producción', color: '#EF4444' },
    { id: 2, nombre: 'Área de Almacenes', color: '#F59E0B' },
    { id: 3, nombre: 'Área de Oficinas', color: '#3B82F6' },
    { id: 4, nombre: 'Área de Comedor', color: '#10B981' },
    { id: 5, nombre: 'Área de Vestidores', color: '#6366F1' }
  ];
};

export const getPersonal = () => {
  // Retornar el personal desde localStorage o datos por defecto
  return [
    { id: 1, nombre: 'Juan Pérez', area: 'Área de Producción', estado: 'Activo', rol: 'Limpieza General' },
    { id: 2, nombre: 'María López', area: 'Área de Almacenes', estado: 'Activo', rol: 'Supervisor' },
    { id: 3, nombre: 'Carlos Ruiz', area: 'Área de Producción', estado: 'Inactivo', rol: 'Limpieza General' },
    { id: 4, nombre: 'Ana García', area: 'Área de Oficinas', estado: 'Activo', rol: 'Especialista' },
    { id: 5, nombre: 'Pedro Sánchez', area: 'Área de Almacenes', estado: 'Activo', rol: 'Supervisor' }
  ];
}; 