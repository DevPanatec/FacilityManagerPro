'use client';

import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { initLocalStorage } from '@/utils/initLocalStorage';
import { UserSelect } from './components/UserSelect';
import { AreaSelect } from './components/AreaSelect';
import { DateSelect } from './components/DateSelect';
import { DurationButtons } from './components/DurationButtons';

interface Task {
  id: number;
  descripcion: string;
  asignado: string;
  prioridad: string;
  estado: string;
  fechaLimite: string;
  startTime: Date | null;
  endTime: Date | null;
}

interface Area {
  id: number;
  nombre: string;
  color: string;
  tareas: Task[];
}

interface FormData {
  user: string;
  area: string;
  date: Date | null;
  duration: string | null;
  description: string;
  priority: string;
}

interface Empleado {
  id: number;
  nombre: string;
  area: string;
  estado: string;
  rol: string;
  turno?: string;
}

const demoAreas: Area[] = [
  {
    id: 1,
    nombre: "Área 1",
    color: "#FF5733",
    tareas: []
  },
  {
    id: 2,
    nombre: "Área 2",
    color: "#33FF57",
    tareas: []
  }
];

const demoEmpleados: Empleado[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    area: "Área 1",
    estado: "Activo",
    rol: "Operario"
  },
  {
    id: 2,
    nombre: "María García",
    area: "Área 2",
    estado: "Activo",
    rol: "Supervisor"
  }
];

export default function AssignmentClient() {
  const [areas, setAreas] = useState<Area[]>(demoAreas);
  const [empleados] = useState<Empleado[]>(demoEmpleados);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    user: "",
    area: "",
    date: null,
    duration: null,
    description: "",
    priority: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user || !formData.area || !formData.date || !formData.duration || !formData.description || !formData.priority) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    const areaId = parseInt(formData.area);
    if (isNaN(areaId)) {
      toast.error('Área inválida');
      return;
    }

    const newTask: Task = {
      id: Math.floor(Math.random() * 1000),
      descripcion: formData.description,
      asignado: formData.user,
      prioridad: formData.priority,
      estado: 'pendiente',
      fechaLimite: format(formData.date, 'yyyy-MM-dd'),
      startTime: formData.date,
      endTime: null
    };

    setAreas(prev => prev.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          tareas: [...area.tareas, newTask]
        };
      }
      return area;
    }));

    setFormData({
      user: "",
      area: "",
      date: null,
      duration: null,
      description: "",
      priority: ""
    });
    
    setSelectedDuration(null);
    toast.success('Tarea asignada exitosamente');
  };

  const actualizarEstadoTarea = (areaId: number, tareaId: number, nuevoEstado: string) => {
    setAreas(prev => prev.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          tareas: area.tareas.map(tarea => {
            if (tarea.id === tareaId) {
              return { ...tarea, estado: nuevoEstado };
            }
            return tarea;
          })
        };
      }
      return area;
    }));

    toast.success(`Tarea actualizada a: ${nuevoEstado.replace('_', ' ')}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">Asignaciones</h1>
            <p className="text-blue-100 mt-1">Gestión de asignaciones del personal</p>
          </div>
          <button
            onClick={() => setShowAllStaff(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Ver Personal
          </button>
        </div>
      </div>

      {/* Panel de Nueva Asignación */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Nueva Asignación
        </h3>
        
        <form onSubmit={handleAssign} className="flex flex-col flex-grow space-y-4">
          <UserSelect 
            value={formData.user}
            onChange={handleChange}
            users={empleados}
          />

          <AreaSelect 
            value={formData.area}
            onChange={handleChange}
            areas={areas}
          />

          <div className="space-y-4 flex-grow">
            <DateSelect 
              selected={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
            />

            <DurationButtons 
              selectedDuration={selectedDuration}
              onSelect={(duration) => {
                setSelectedDuration(duration);
                setFormData(prev => ({ ...prev, duration }));
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!formData.user || !formData.area || !formData.date}
            className={`
              w-full py-3 rounded-xl text-lg font-semibold shadow-md 
              transition-all duration-200
              ${(formData.user && formData.area && formData.date)
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 cursor-not-allowed text-gray-500'}
            `}
          >
            Asignar
          </button>
        </form>
      </div>

      {/* Modal de Personal */}
      {showAllStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Personal Total</h3>
                  <p className="text-sm text-gray-500">{empleados.length} empleados registrados</p>
                </div>
                <button 
                  onClick={() => setShowAllStaff(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {empleados.map((empleado) => (
                  <div key={empleado.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {empleado.nombre.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {empleado.nombre}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {empleado.rol}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${empleado.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {empleado.estado}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Área: {empleado.area}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 