'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import JSZip from 'jszip';
import { initLocalStorage } from '../../utils/initLocalStorage';
import { demoTasks, getTaskStats } from '../../mocks/taskData';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Datos de todo el personal
const allStaff = [
  { id: 1, nombre: 'Juan Pérez', area: 'Bioseguridad', turno: 'Mañana', rol: 'Limpieza General', estado: 'Activo' },
  { id: 2, nombre: 'María López', area: 'Inyección', turno: 'Tarde', rol: 'Supervisor', estado: 'Activo' },
  { id: 3, nombre: 'Carlos Ruiz', area: 'Cuarto Frío', turno: 'Noche', rol: 'Limpieza General', estado: 'Inactivo' },
  { id: 4, nombre: 'Ana García', area: 'Producción', turno: 'Mañana', rol: 'Especialista', estado: 'Activo' },
  { id: 5, nombre: 'Pedro Sánchez', area: 'Techos, Paredes y Pisos', turno: 'Mañana', rol: 'Supervisor', estado: 'Activo' },
  { id: 6, nombre: 'Laura Torres', area: 'Canaletas y Rejillas', turno: 'Tarde', rol: 'Limpieza General', estado: 'Activo' },
  { id: 7, nombre: 'Miguel Ángel', area: 'Área Externa', turno: 'Noche', rol: 'Auxiliar', estado: 'Activo' },
  { id: 8, nombre: 'Isabel Díaz', area: 'Bioseguridad', turno: 'Mañana', rol: 'Limpieza General', estado: 'Activo' },
  { id: 9, nombre: 'Roberto Martín', area: 'Inyección', turno: 'Tarde', rol: 'Especialista', estado: 'Inactivo' },
  { id: 10, nombre: 'Carmen Vega', area: 'Cuarto Frío', turno: 'Noche', rol: 'Limpieza General', estado: 'Activo' },
  { id: 11, nombre: 'Fernando Gil', area: 'Producción', turno: 'Mañana', rol: 'Auxiliar', estado: 'Activo' },
  { id: 12, nombre: 'Patricia López', area: 'Techos, Paredes y Pisos', turno: 'Tarde', rol: 'Supervisor', estado: 'Activo' },
  { id: 13, nombre: 'José Torres', area: 'Canaletas y Rejillas', turno: 'Noche', rol: 'Limpieza General', estado: 'Inactivo' },
  { id: 14, nombre: 'Lucía Martínez', area: 'Área Externa', turno: 'Mañana', rol: 'Especialista', estado: 'Activo' },
  { id: 15, nombre: 'Alberto Ruiz', area: 'Bioseguridad', turno: 'Tarde', rol: 'Limpieza General', estado: 'Activo' }
];

const personalTotal = [
  { id: 1, nombre: 'Juan Pérez', area: 'Área de Producción', estado: 'Activo', rol: 'Limpieza General' },
  { id: 2, nombre: 'María López', area: 'Área de Almacenes', estado: 'Activo', rol: 'Supervisor' },
  { id: 3, nombre: 'Carlos Ruiz', area: 'Área de Producción', estado: 'Inactivo', rol: 'Limpieza General' },
  { id: 4, nombre: 'Ana García', area: 'Área de Oficinas', estado: 'Activo', rol: 'Especialista' },
  { id: 5, nombre: 'Pedro Sánchez', area: 'Área de Almacenes', estado: 'Activo', rol: 'Supervisor' },
  { id: 16, nombre: 'usuario', area: 'Administración', estado: 'Activo', rol: 'Administrativo' }
];

const areasTareasIniciales = [
  {
    id: 1,
    nombre: 'Bioseguridad',
    color: '#FF6B6B',
    tareas: []
  },
  {
    id: 2,
    nombre: 'Inyección',
    color: '#4ECDC4',
    tareas: []
  }
];

const getTareas = async () => {
  try {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      return areasTareasIniciales;
    }
    
    const tareas = localStorage.getItem('tareas');
    if (!tareas) {
      return areasTareasIniciales;
    }
    return JSON.parse(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return areasTareasIniciales;
  }
};

export default function EnterpriseOverviewPage() {
  // ... existing code ...
}