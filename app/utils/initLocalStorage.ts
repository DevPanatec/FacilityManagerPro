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