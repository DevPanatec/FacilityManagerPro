import { areasData } from '../mocks/areasData';

export type Area = {
  id: number;
  nombre: string;
  color: string;
  tareas: Tarea[];
};

export type Tarea = {
  id: number;
  descripcion: string;
  prioridad: string;
  estado: string;
};

export const getAreas = (): Area[] => {
  const stored = localStorage.getItem('areas');
  if (stored) return JSON.parse(stored);
  return areasData;
};

export const setAreas = (areas: Area[]) => {
  localStorage.setItem('areas', JSON.stringify(areas));
};

export const getTareas = () => {
  if (typeof window !== 'undefined') {
    const tareas = localStorage.getItem('tareas');
    return tareas ? JSON.parse(tareas) as Tarea[] : null;
  }
  return null;
};

export const setTareas = (tareas: Tarea[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tareas', JSON.stringify(tareas));
  }
};

export function initLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error accessing localStorage';
    console.error('Error accessing localStorage:', errorMessage);
    return defaultValue;
  }
}
