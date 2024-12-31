'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import { initLocalStorage } from '../../utils/initLocalStorage';
import { demoTasks, getTaskStats } from '../../mocks/taskData';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

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

export default function EnterpriseOverviewPage() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [areasTareas, setAreasTareas] = useState(() => {
    const savedTareas = getTareas();
    return savedTareas || [
      {
        id: 1,
        nombre: 'Bioseguridad',
        color: '#FF6B6B',
        tareas: [
          {
            id: 1,
            descripcion: 'Desinfección de trajes y EPP',
            asignado: 'Juan Pérez',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-28T08:15:00",
            endTime: "2024-11-28T09:30:00"
          },
          {
            id: 2,
            descripcion: 'Limpieza de duchas de descontaminación',
            asignado: 'María López',
            estado: 'en_progreso',
            prioridad: 'alta',
            startTime: "2024-11-29T10:00:00",
            endTime: null
          },
          {
            id: 3,
            descripcion: 'Reposición de materiales de bioseguridad',
            asignado: 'Carlos Ruiz',
            estado: 'pendiente',
            prioridad: 'media',
            startTime: null,
            endTime: null
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
            descripcion: 'Limpieza de máquinas inyectoras',
            asignado: 'Ana García',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-28T07:00:00",
            endTime: "2024-11-28T08:45:00"
          },
          {
            id: 5,
            descripcion: 'Desinfección de moldes',
            asignado: 'Pedro Sánchez',
            estado: 'en_progreso',
            prioridad: 'alta',
            startTime: "2024-11-29T09:30:00",
            endTime: null
          },
          {
            id: 6,
            descripcion: 'Limpieza de área de enfriamiento',
            asignado: 'Laura Torres',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-29T06:00:00",
            endTime: "2024-11-29T07:30:00"
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
            descripcion: 'Limpieza de estanterías refrigeradas',
            asignado: 'Miguel Ángel',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-27T06:30:00",
            endTime: "2024-11-27T08:00:00"
          },
          {
            id: 8,
            descripcion: 'Desinfección de superficies frías',
            asignado: 'Isabel Díaz',
            estado: 'en_progreso',
            prioridad: 'alta',
            startTime: "2024-11-29T08:00:00",
            endTime: null
          },
          {
            id: 9,
            descripcion: 'Limpieza de sistemas de refrigeración',
            asignado: 'Roberto Martín',
            estado: 'pendiente',
            prioridad: 'alta',
            startTime: null,
            endTime: null
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
            descripcion: 'Limpieza de líneas de producción',
            asignado: 'Carmen Vega',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-28T06:30:00",
            endTime: "2024-11-28T08:00:00"
          },
          {
            id: 11,
            descripcion: 'Desinfección de equipos de envasado',
            asignado: 'Fernando Gil',
            estado: 'en_progreso',
            prioridad: 'alta',
            startTime: "2024-11-29T09:00:00",
            endTime: null
          },
          {
            id: 12,
            descripcion: 'Limpieza de bandas transportadoras',
            asignado: 'Patricia López',
            estado: 'pendiente',
            prioridad: 'media',
            startTime: null,
            endTime: null
          }
        ]
      },
      {
        id: 5,
        nombre: 'Techos, Paredes y Pisos',
        color: '#FFB347',
        tareas: [
          {
            id: 13,
            descripcion: 'Limpieza profunda de techos',
            asignado: 'José Torres',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-28T07:30:00",
            endTime: "2024-11-28T09:00:00"
          },
          {
            id: 14,
            descripcion: 'Desinfección de paredes',
            asignado: 'Lucía Martínez',
            estado: 'en_progreso',
            prioridad: 'alta',
            startTime: "2024-11-29T09:15:00",
            endTime: null
          },
          {
            id: 15,
            descripcion: 'Limpieza y sellado de pisos',
            asignado: 'Alberto Ruiz',
            estado: 'pendiente',
            prioridad: 'alta',
            startTime: null,
            endTime: null
          }
        ]
      },
      {
        id: 6,
        nombre: 'Canaletas y Rejillas',
        color: '#A7C7E7',
        tareas: [
          {
            id: 16,
            descripcion: 'Limpieza de canaletas principales',
            asignado: 'Juan Pérez',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-28T06:00:00",
            endTime: "2024-11-28T08:30:00"
          },
          {
            id: 17,
            descripcion: 'Desinfección de rejillas',
            asignado: 'María López',
            estado: 'en_progreso',
            prioridad: 'media',
            startTime: "2024-11-29T08:45:00",
            endTime: null
          },
          {
            id: 18,
            descripcion: 'Mantenimiento de drenajes',
            asignado: 'Carlos Ruiz',
            estado: 'completada',
            prioridad: 'alta',
            startTime: "2024-11-29T07:00:00",
            endTime: "2024-11-29T07:30:00"
          }
        ]
      },
      {
        id: 7,
        nombre: 'Área Externa',
        color: '#98D8AA',
        tareas: [
          {
            id: 19,
            descripcion: 'Limpieza de áreas verdes',
            asignado: 'Ana García',
            estado: 'completada',
            prioridad: 'media',
            startTime: "2024-11-28T06:30:00",
            endTime: "2024-11-28T08:00:00"
          },
          {
            id: 20,
            descripcion: 'Limpieza de estacionamiento',
            asignado: 'Pedro Sánchez',
            estado: 'en_progreso',
            prioridad: 'baja',
            startTime: "2024-11-29T08:15:00",
            endTime: null
          },
          {
            id: 21,
            descripcion: 'Mantenimiento de aceras y accesos',
            asignado: 'Laura Torres',
            estado: 'pendiente',
            prioridad: 'media',
            startTime: null,
            endTime: null
          }
        ]
      }
    ];
  });
  const [personal, setPersonal] = useState(allStaff);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos de áreas
  const areasData = [
    { nombre: 'Bioseguridad', personal: 8, color: '#FF6B6B' },
    { nombre: 'Inyección', personal: 6, color: '#4ECDC4' },
    { nombre: 'Cuarto Frío', personal: 5, color: '#45B7D1' },
    { nombre: 'Producción', personal: 10, color: '#96CEB4' },
    { nombre: 'Techos, Paredes y Pisos', personal: 7, color: '#FFB347' },
    { nombre: 'Canaletas y Rejillas', personal: 4, color: '#A7C7E7' },
    { nombre: 'Área Externa', personal: 5, color: '#98D8AA' }
  ];

  // Datos de turnos
  const turnosData = [
    {
      nombre: 'Mañana',
      total: 15,
      activos: 12,
      color: '#3B82F6',
      horario: '6:00 - 14:00',
      personal: [
        { id: 1, nombre: 'Juan Pérez', area: 'Urgencias', estado: 'activo' },
        { id: 2, nombre: 'María López', area: 'UCI', estado: 'activo' },
        { id: 3, nombre: 'Carlos Ruiz', area: 'Consultas', estado: 'inactivo' },
        { id: 4, nombre: 'Ana García', area: 'Quirófano', estado: 'activo' }
      ]
    },
    {
      nombre: 'Tarde',
      total: 12,
      activos: 10,
      color: '#10B981',
      horario: '14:00 - 22:00',
      personal: [
        { id: 5, nombre: 'Pedro Sánchez', area: 'Urgencias', estado: 'activo' },
        { id: 6, nombre: 'Laura Torres', area: 'UCI', estado: 'activo' },
        { id: 7, nombre: 'Miguel Ángel', area: 'Laboratorio', estado: 'activo' }
      ]
    },
    {
      nombre: 'Noche',
      total: 8,
      activos: 7,
      color: '#6366F1',
      horario: '22:00 - 6:00',
      personal: [
        { id: 8, nombre: 'Isabel Díaz', area: 'Urgencias', estado: 'activo' },
        { id: 9, nombre: 'Roberto Martín', area: 'UCI', estado: 'activo' },
        { id: 10, nombre: 'Carmen Vega', area: 'Laboratorio', estado: 'inactivo' }
      ]
    }
  ];

  // Datos de inventario crítico
  const inventarioCritico = [
    { 
      id: 1, 
      nombre: 'Limpiador Multiusos', 
      stock: 150, 
      minimo: 200,
      area: 'Almacén',
      ultimoUso: '2024-02-20',
      estado: 'critico'
    },
    { 
      id: 2, 
      nombre: 'Desengrasante Industrial', 
      stock: 80, 
      minimo: 100,
      area: 'Producción',
      ultimoUso: '2024-02-19',
      estado: 'advertencia'
    },
    { 
      id: 3, 
      nombre: 'Escobas Industriales', 
      stock: 50, 
      minimo: 100,
      area: 'General',
      ultimoUso: '2024-02-21',
      estado: 'critico'
    },
    { 
      id: 4, 
      nombre: 'Trapeadores', 
      stock: 120, 
      minimo: 150,
      area: 'General',
      ultimoUso: '2024-02-18',
      estado: 'advertencia'
    },
    { 
      id: 5, 
      nombre: 'Paños de Microfibra', 
      stock: 45, 
      minimo: 100,
      area: 'Producción',
      ultimoUso: '2024-02-20',
      estado: 'critico'
    },
    { 
      id: 6, 
      nombre: 'Detergente Industrial', 
      stock: 85, 
      minimo: 100,
      area: 'Almacén',
      ultimoUso: '2024-02-17',
      estado: 'advertencia'
    }
  ];

  // Función para navegar al inventario completo
  const irAInventario = () => {
    router.push('/admin/inventory');
  };

  // Función para navegar a la vista detallada de un área
  const verDetalleArea = (areaId) => {
    router.push(`/admin/assignments/${areaId}`);
  };

  // Función para manejar el clic en "Ver detalle" de un área
  const handleVerDetalle = (area) => {
    setSelectedArea(area);
    setShowAreaModal(true);
  };

  // Componente Modal para el detalle del área
  const AreaDetalleModal = () => {
    if (!selectedArea) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Área: {selectedArea.nombre}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedArea.tareas.length} tareas asignadas
                </p>
              </div>
              <button 
                onClick={() => setShowAreaModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-6">
              {/* Sección de Tareas */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Tareas Actuales</h4>
                <div className="space-y-4">
                  {selectedArea.tareas.map((tarea) => (
                    <div key={tarea.id} 
                         className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{tarea.descripcion}</h5>
                          <p className="text-sm text-gray-500">Asignado a: {tarea.asignado}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${tarea.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                              tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'}`}>
                            {tarea.prioridad}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${tarea.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              tarea.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'}`}>
                            {tarea.estado.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección de Personal Asignado */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Asignado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalPorArea[selectedArea.id]?.map((persona) => (
                    <div key={persona.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {persona.nombre.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{persona.nombre}</p>
                          <p className="text-xs text-gray-500">{persona.turno}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Datos de personal por área
  const personalPorArea = {
    1: [ // Producción
      { id: 1, nombre: 'Juan Pérez', turno: 'Mañana' },
      { id: 2, nombre: 'María López', turno: 'Tarde' },
      { id: 3, nombre: 'Carlos Ruiz', turno: 'Noche' },
      { id: 4, nombre: 'Ana García', turno: 'Mañana' }
    ],
    2: [ // Almacenes
      { id: 5, nombre: 'Pedro Sánchez', turno: 'Mañana' },
      { id: 6, nombre: 'Laura Torres', turno: 'Tarde' },
      { id: 7, nombre: 'Miguel Ángel', turno: 'Noche' }
    ],
    // ... más personal por área
  };

  // Componente para mostrar todo el personal
  const PersonalTotal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Personal Total de Limpieza Industrial
            </h3>
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
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStaff.map((empleado) => (
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
                  <p>Turno: {empleado.turno}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleDeleteTask = (areaId, tareaId) => {
    setAreasTareas(prev => prev.map(area => {
      if (area.id === areaId) {
        return {
          ...area,
          tareas: area.tareas.filter(tarea => tarea.id !== tareaId)
        };
      }
      return area;
    }));
    toast.success("Tarea eliminada correctamente");
  };

  const TarjetaArea = ({ area }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow
      border-l-4 flex flex-col h-[500px]`} style={{ borderLeftColor: area.color }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold" style={{ color: area.color }}>
          {area.nombre}
        </h3>
        <span className="text-sm font-medium px-3 py-1 rounded-full" 
          style={{ 
            backgroundColor: `${area.color}15`,
            color: area.color 
          }}>
          {area.tareas.length} tareas
        </span>
      </div>
      
      {/* Contenedor con scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-3">
          {area.tareas.map((tarea) => (
            <div 
              key={tarea.id}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors relative"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">{tarea.descripcion}</h5>
                  <p className="text-sm text-gray-500">Asignado a: {tarea.asignado}</p>
                  <div className="flex flex-col space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <FaClock className="w-3 h-3" />
                      <span>Inicio: {tarea.startTime ? 
                        new Date(tarea.startTime).toLocaleString() : 
                        'No iniciada'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaRegCalendarCheck className="w-3 h-3" />
                      <span>Finalización: {tarea.endTime ? 
                        new Date(tarea.endTime).toLocaleString() : 
                        'En progreso'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de progreso fija en la parte inferior */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progreso</span>
          <span className="font-medium" style={{ color: area.color }}>
            {area.tareas.filter(t => t.estado === 'completada').length}/{area.tareas.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(area.tareas.filter(t => t.estado === 'completada').length / area.tareas.length) * 100}%`,
              backgroundColor: area.color
            }}
          />
        </div>
      </div>
    </div>
  );

  const TaskList = () => {
    const stats = getTaskStats();
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Estado de Tareas</h2>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Tareas</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Completadas</h3>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">En Proceso</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Tasa de Completado</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demoTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.titulo}</div>
                    <div className="text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.prioridad === 'Alta' ? 'bg-red-100 text-red-800' : 
                          task.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {task.prioridad}
                      </span>
                      <span className="mx-2">•</span>
                      {task.responsable}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.area}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${task.estado === 'Completado' ? 'bg-green-100 text-green-800' : 
                        task.estado === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {task.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          task.progreso === 100 ? 'bg-green-600' : 
                          task.progreso > 50 ? 'bg-yellow-600' : 
                          'bg-blue-600'
                        }`}
                        style={{ width: `${task.progreso}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.progreso}% completado
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedTareas = getTareas();
      if (updatedTareas) {
        setAreasTareas(updatedTareas);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleExport = async (format) => {
    if (loading) return;

    try {
      setLoading(true);
      setShowExportMenu(false);

      // Recopilación de datos reales
      const resumenGeneral = {
        resumen: {
          turnos: {
            mañana: turnosData[0].personal.map(p => ({
              nombre: p.nombre,
              area: p.area,
              estado: p.estado
            })),
            tarde: turnosData[1].personal.map(p => ({
              nombre: p.nombre,
              area: p.area,
              estado: p.estado
            })),
            noche: turnosData[2].personal.map(p => ({
              nombre: p.nombre,
              area: p.area,
              estado: p.estado
            }))
          },
          areas: areasData.map(area => {
            const areaTareas = areasTareas.find(a => a.nombre === area.nombre);
            const personalArea = allStaff.filter(p => p.area === area.nombre);
            return {
              nombre: area.nombre,
              personal_total: personalArea.length,
              personal_activo: personalArea.filter(p => p.estado === 'Activo').length,
              tareas_total: areaTareas?.tareas.length || 0,
              tareas_completadas: areaTareas?.tareas.filter(t => t.estado === 'completada').length || 0,
              tareas_pendientes: areaTareas?.tareas.filter(t => t.estado === 'pendiente').length || 0,
              tareas_en_progreso: areaTareas?.tareas.filter(t => t.estado === 'en_progreso').length || 0
            };
          }),
          personal: {
            total: allStaff.length,
            activos: allStaff.filter(p => p.estado === 'Activo').length,
            por_rol: {
              supervisores: allStaff.filter(p => p.rol === 'Supervisor').length,
              operarios: allStaff.filter(p => p.rol === 'Limpieza General').length,
              especialistas: allStaff.filter(p => p.rol === 'Especialista').length
            }
          },
          inventario: inventarioCritico.map(item => ({
            nombre: item.nombre,
            stock_actual: item.stock,
            stock_minimo: item.minimo,
            area: item.area,
            estado: item.estado,
            ultimo_uso: item.ultimoUso
          }))
        },
        detalle_tareas: areasTareas.flatMap(area => 
          area.tareas.map(tarea => ({
            area: area.nombre,
            descripcion: tarea.descripcion,
            asignado: tarea.asignado,
            estado: tarea.estado,
            prioridad: tarea.prioridad,
            inicio: tarea.startTime,
            fin: tarea.endTime
          }))
        )
      };

      switch (format) {
        case 'excel':
          const wb = XLSX.utils.book_new();
          
          // Hoja de Resumen General
          const resumenSheet = XLSX.utils.json_to_sheet([{
            total_personal: resumenGeneral.resumen.personal.total,
            personal_activo: resumenGeneral.resumen.personal.activos,
            total_areas: resumenGeneral.resumen.areas.length,
            total_tareas: resumenGeneral.detalle_tareas.length,
            items_criticos: resumenGeneral.resumen.inventario.filter(i => i.estado === 'critico').length
          }]);
          XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');

          // Hoja de Personal por Área
          const personalSheet = XLSX.utils.json_to_sheet(
            resumenGeneral.resumen.areas.map(area => ({
              area: area.nombre,
              total_personal: area.personal_total,
              personal_activo: area.personal_activo,
              tareas_total: area.tareas_total,
              tareas_completadas: area.tareas_completadas
            }))
          );
          XLSX.utils.book_append_sheet(wb, personalSheet, 'Personal por Área');

          // Hoja de Tareas
          const tareasSheet = XLSX.utils.json_to_sheet(resumenGeneral.detalle_tareas);
          XLSX.utils.book_append_sheet(wb, tareasSheet, 'Tareas');

          // Hoja de Inventario
          const inventarioSheet = XLSX.utils.json_to_sheet(resumenGeneral.resumen.inventario);
          XLSX.utils.book_append_sheet(wb, inventarioSheet, 'Inventario');

          XLSX.writeFile(wb, 'reporte_completo.xlsx');
          break;

        case 'json':
          const blob = new Blob([JSON.stringify(resumenGeneral, null, 2)], 
            { type: 'application/json' });
          saveAs(blob, 'reporte_completo.json');
          break;

        case 'csv':
          // Para CSV exportamos un resumen más detallado por área
          const csvData = resumenGeneral.resumen.areas.map(area => ({
            area: area.nombre,
            personal_total: area.personal_total,
            personal_activo: area.personal_activo,
            tareas_total: area.tareas_total,
            tareas_completadas: area.tareas_completadas,
            tareas_pendientes: area.tareas_pendientes,
            tareas_en_progreso: area.tareas_en_progreso
          }));
          
          const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(csvData));
          const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          saveAs(csvBlob, 'reporte_areas.csv');
          break;
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Primero, agregar la función para eliminar una empresa
  const handleDeleteOrganization = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      try {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Actualizar la lista de empresas
        loadData();
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('Error al eliminar la empresa');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Botones de acción */}
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={() => setShowAllStaff(true)}
          className="bg-blue-50 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow
                   text-blue-600 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Ver Todo el Personal (98)</span>
        </button>

        {/* Nuevo botón de exportar */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={loading}
            className={`bg-blue-50 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow
                     text-blue-600 font-medium flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span>Exportando...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Exportar Datos</span>
              </>
            )}
          </button>

          {/* Menú de opciones de exportación */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    handleExport('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar como JSON</span>
                </button>
                <button
                  onClick={() => {
                    handleExport('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar como CSV</span>
                </button>
                <button
                  onClick={() => {
                    handleExport('excel');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar como Excel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Turnos */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {turnosData.map((turno) => (
              <button
                key={turno.nombre}
                onClick={() => {
                  setSelectedTurno(turno);
                  setShowTurnoModal(true);
                }}
                className="bg-white rounded-xl shadow-lg p-6 transform transition-all 
                         hover:scale-105 hover:shadow-xl focus:outline-none"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{turno.nombre}</h3>
                    <p className="text-sm text-gray-500">{turno.horario}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${turno.color}20`, color: turno.color }}>
                    {turno.activos} activos
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Capacidad</span>
                    <span className="font-medium">{turno.activos}/{turno.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(turno.activos / turno.total) * 100}%`,
                        backgroundColor: turno.color
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Gráfico de Distribución */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Distribución por Áreas
              </h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4 4v16h16M4 20l16-16M6 16l4-4m4-4l4-4" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grfico de Dona */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areasData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="personal"
                    >
                      {areasData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                              <p className="font-medium" style={{ color: data.color }}>
                                {data.nombre}
                              </p>
                              <p className="text-sm text-gray-600">
                                Personal: {data.personal}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista de Áreas */}
              <div className="space-y-3">
                {areasData.map((area) => (
                  <div 
                    key={area.nombre}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-medium text-gray-700">
                        {area.nombre}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {area.personal} personal
                      </span>
                      <span className="text-sm font-medium" style={{ color: area.color }}>
                        {`${Math.round((area.personal / areasData.reduce((acc, curr) => acc + curr.personal, 0)) * 100)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Inventario Crítico */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventario Crítico</h2>
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ height: '464px' }}>
            <div className="space-y-3">
              {inventarioCritico.slice(0, 4).map((item) => (
                <div key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{item.nombre}</h4>
                      <p className="text-xs text-gray-500">{item.area}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${item.estado === 'critico' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.stock} unidades
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        item.estado === 'critico' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{
                        width: `${Math.min((item.stock / item.minimo) * 100, 100)}%`
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>Último uso: {item.ultimoUso}</span>
                    <span>Mínimo: {item.minimo}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => router.push('/shared/inventory')}
              className="mt-6 w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg
                       hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
            >
              Ver Inventario Completo
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Tareas por Área */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tareas por Área</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areasTareas.map((area) => (
            <TarjetaArea key={area.id} area={area} />
          ))}
        </div>
      </div>

      {/* Modal de Detalle de Turno */}
      {showTurnoModal && selectedTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Personal del Turno {selectedTurno.nombre}
                </h3>
                <button 
                  onClick={() => setShowTurnoModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {selectedTurno.personal.map((persona) => (
                  <div key={persona.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {persona.nombre.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{persona.nombre}</h4>
                        <p className="text-sm text-gray-500">{persona.area}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${persona.estado === 'activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'}`}>
                      {persona.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personal Total */}
      {showAllStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-4">
            {/* Encabezado del Modal */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Personal Total de Limpieza Industrial
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Lista completa del personal por áreas y turnos
                  </p>
                </div>
                <button 
                  onClick={() => setShowAllStaff(false)}
                  className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6">
              {/* Filtros y estadísticas */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Personal</p>
                  <p className="text-2xl font-bold text-blue-700">{allStaff.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Personal Activo</p>
                  <p className="text-2xl font-bold text-green-700">
                    {allStaff.filter(p => p.estado === 'Activo').length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Supervisores</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {allStaff.filter(p => p.rol === 'Supervisor').length}
                  </p>
                </div>
              </div>

              {/* Lista de Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allStaff.map((persona) => (
                  <div key={persona.id} 
                       className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-lg">
                          {persona.nombre.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{persona.nombre}</h4>
                        <p className="text-sm text-gray-500">{persona.area}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {persona.rol}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            Turno {persona.turno}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${persona.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'}`}>
                      {persona.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showAreaModal && <AreaDetalleModal />}
    </div>
  );
}