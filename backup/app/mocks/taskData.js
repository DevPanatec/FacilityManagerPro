export const demoTasks = [
  {
    id: 1,
    area: 'Área de Procesamiento',
    titulo: 'Limpieza de máquinas procesadoras de pescado',
    estado: 'Completado',
    fechaInicio: '2024-03-10',
    fechaFin: '2024-03-11',
    responsable: 'Carlos Méndez',
    prioridad: 'Alta',
    progreso: 100,
  },
  {
    id: 2,
    area: 'Área de Empaque',
    titulo: 'Sanitización de línea de empaque',
    estado: 'En Proceso',
    fechaInicio: '2024-03-12',
    fechaFin: '2024-03-13',
    responsable: 'Ana Martínez',
    prioridad: 'Media',
    progreso: 65,
  },
  {
    id: 3,
    area: 'Cámaras de Frío',
    titulo: 'Limpieza y desinfección de cámaras frigoríficas',
    estado: 'Pendiente',
    fechaInicio: '2024-03-14',
    fechaFin: '2024-03-15',
    responsable: 'Roberto García',
    prioridad: 'Alta',
    progreso: 0,
  },
  {
    id: 4,
    area: 'Área de Control de Calidad',
    titulo: 'Sanitización de equipos de control',
    estado: 'En Proceso',
    fechaInicio: '2024-03-13',
    fechaFin: '2024-03-14',
    responsable: 'María López',
    prioridad: 'Alta',
    progreso: 80,
  },
  {
    id: 5,
    area: 'Área de Recepción',
    titulo: 'Limpieza de zona de descarga',
    estado: 'Completado',
    fechaInicio: '2024-03-11',
    fechaFin: '2024-03-12',
    responsable: 'Juan Pérez',
    prioridad: 'Alta',
    progreso: 100,
  },
  {
    id: 6,
    area: 'Área de Empaque',
    titulo: 'Desinfección de bandas transportadoras',
    estado: 'En Proceso',
    fechaInicio: '2024-03-13',
    fechaFin: '2024-03-14',
    responsable: 'Laura Sánchez',
    prioridad: 'Media',
    progreso: 45,
  },
  {
    id: 7,
    area: 'Área de Procesamiento',
    titulo: 'Limpieza de fileteadoras',
    estado: 'Completado',
    fechaInicio: '2024-03-10',
    fechaFin: '2024-03-11',
    responsable: 'Diego Ramírez',
    prioridad: 'Alta',
    progreso: 100,
  },
  {
    id: 8,
    area: 'Área de Control de Calidad',
    titulo: 'Sanitización de laboratorio',
    estado: 'En Proceso',
    fechaInicio: '2024-03-12',
    fechaFin: '2024-03-13',
    responsable: 'Patricia Torres',
    prioridad: 'Media',
    progreso: 30,
  }
];

export const getTasksByArea = (area) => {
  return demoTasks.filter(task => task.area === area);
};

export const getTasksByStatus = (status) => {
  return demoTasks.filter(task => task.estado === status);
};

export const getTaskStats = () => {
  const total = demoTasks.length;
  const completed = demoTasks.filter(task => task.estado === 'Completado').length;
  const inProgress = demoTasks.filter(task => task.estado === 'En Proceso').length;
  const pending = demoTasks.filter(task => task.estado === 'Pendiente').length;

  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate: Math.round((completed / total) * 100)
  };
}; 