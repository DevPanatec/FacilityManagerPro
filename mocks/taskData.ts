export const demoTasks = [
  {
    id: 1,
    title: 'Limpieza General',
    description: 'Realizar limpieza general del área',
    status: 'pending',
    priority: 'high',
    assignedTo: 'Juan Pérez',
    area: 'Bioseguridad'
  },
  {
    id: 2,
    title: 'Mantenimiento',
    description: 'Mantenimiento de equipos',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'María López',
    area: 'Inyección'
  }
];

export const getTaskStats = () => {
  const total = demoTasks.length;
  const completed = demoTasks.filter(t => t.status === 'completed').length;
  const inProgress = demoTasks.filter(t => t.status === 'in_progress').length;
  const pending = demoTasks.filter(t => t.status === 'pending').length;

  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  };
}; 