export const initLocalStorage = () => {
  if (typeof window === 'undefined') return;

  // Inicializar tareas si no existen
  if (!localStorage.getItem('tareas')) {
    localStorage.setItem('tareas', JSON.stringify([]));
  }

  // Inicializar preferencias si no existen
  if (!localStorage.getItem('preferences')) {
    localStorage.setItem('preferences', JSON.stringify({
      theme: 'light',
      notifications: true,
      language: 'es'
    }));
  }

  // Inicializar configuración si no existe
  if (!localStorage.getItem('config')) {
    localStorage.setItem('config', JSON.stringify({
      autoSave: true,
      refreshInterval: 5000
    }));
  }
}

export const getTareas = () => {
  if (typeof window === 'undefined') return null;
  const tareas = localStorage.getItem('tareas');
  return tareas ? JSON.parse(tareas) : null;
}

export const getAreas = () => {
  if (typeof window === 'undefined') return null;
  const areas = localStorage.getItem('areas');
  return areas ? JSON.parse(areas) : null;
}

export const getPersonal = () => {
  if (typeof window === 'undefined') return null;
  const personal = localStorage.getItem('personal');
  return personal ? JSON.parse(personal) : null;
} 