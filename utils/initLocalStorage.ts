import { demoAreas } from '@/mocks/areasData';

export type Area = {
  id: number;
  nombre: string;
  color: string;
  tareas: any[];
};

export const getAreas = (): Area[] => {
  const stored = localStorage.getItem('areas');
  if (stored) return JSON.parse(stored);
  return demoAreas;
};

export const setAreas = (areas: Area[]) => {
  localStorage.setItem('areas', JSON.stringify(areas));
};

export const getTareas = () => {
  if (typeof window !== 'undefined') {
    const tareas = localStorage.getItem('tareas');
    return tareas ? JSON.parse(tareas) : null;
  }
  return null;
};

export interface Tarea {
  id: string | number;
  descripcion: string;
  prioridad: string;
  estado: string;
  title?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: string;
  area_id?: string;
  sala_id?: string;
}

export const setTareas = (tareas: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tareas', JSON.stringify(tareas));
  }
};

export function initLocalStorage(key: string, defaultValue: any) {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error accessing localStorage:', error)
    return defaultValue
  }
}