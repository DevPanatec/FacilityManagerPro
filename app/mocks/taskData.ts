export const demoTasks = [
  {
    id: 1,
    nombre: 'Bioseguridad',
    color: '#FF6B6B',
    tareas: [
      {
        id: 1,
        titulo: 'Desinfección de trajes y EPP',
        asignado: 'Juan Pérez',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/3
      },
      {
        id: 2,
        titulo: 'Limpieza de duchas de descontaminación',
        asignado: 'Ana Martínez',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 2/3
      },
      {
        id: 3,
        titulo: 'Reposición de materiales de bioseguridad',
        asignado: 'Carlos Gómez',
        estado: 'Pendiente',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 0
      }
    ]
  },
  {
    id: 2,
    nombre: 'Inyección',
    color: '#4ECDC4',
    tareas: [
      {
        id: 4,
        titulo: 'Limpieza de máquinas inyectoras',
        asignado: 'María Torres',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/2
      },
      {
        id: 5,
        titulo: 'Desinfección de moldes',
        asignado: 'Carlos Gómez',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/3
      },
      {
        id: 6,
        titulo: 'Limpieza de área de enfriamiento',
        asignado: 'Laura Torres',
        estado: 'Pendiente',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 0
      }
    ]
  },
  {
    id: 3,
    nombre: 'Cuarto Frío',
    color: '#45B7D1',
    tareas: [
      {
        id: 7,
        titulo: 'Limpieza de estanterías refrigeradas',
        asignado: 'Rafael Soto',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 2/3
      },
      {
        id: 8,
        titulo: 'Desinfección de superficies frías',
        asignado: 'Roberto Martín',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/3
      },
      {
        id: 9,
        titulo: 'Limpieza de sistemas de refrigeración',
        asignado: 'Carmen Vega',
        estado: 'Pendiente',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 0
      }
    ]
  },
  {
    id: 4,
    nombre: 'Producción',
    color: '#96CEB4',
    tareas: [
      {
        id: 10,
        titulo: 'Limpieza de líneas de producción',
        asignado: 'Miguel Angel',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/2
      }
    ]
  },
  {
    id: 5,
    nombre: 'Techos, Paredes y Pisos',
    color: '#FFEEAD',
    tareas: [
      {
        id: 11,
        titulo: 'Limpieza profunda de techos',
        asignado: 'Laura Torres',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 1/3
      }
    ]
  },
  {
    id: 6,
    nombre: 'Canaletas y Rejillas',
    color: '#FF9999',
    tareas: [
      {
        id: 12,
        titulo: 'Limpieza de canaletas principales',
        asignado: 'Carlos Gómez',
        estado: 'En progreso',
        fechaInicio: '2024/02/25',
        fechaFin: '2024/02/25',
        progreso: 2/3
      }
    ]
  }
];

export const getTaskStats = () => {
  let completed = 0;
  let inProgress = 0;

  demoTasks.forEach(area => {
    area.tareas.forEach(tarea => {
      if (tarea.progreso === 1) {
        completed++;
      } else if (tarea.progreso > 0) {
        inProgress++;
      }
    });
  });

  return {
    completed,
    inProgress
  };
}; 