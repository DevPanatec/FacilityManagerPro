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
    return tareas ? JSON.parse(tareas) : null;
  }
  return null;
};

export const setTareas = (tareas) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tareas', JSON.stringify(tareas));
  }
};