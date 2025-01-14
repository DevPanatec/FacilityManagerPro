'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import { getAreas, getPersonal, getTareas } from '@/utils/initLocalStorage';
import { demoTasks, getTaskStats } from '../../mocks/taskData';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface Turno {
  nombre: string;
  total: number;
  activos: number;
  color: string;
  horario: string;
  personal: {
    id: number;
    nombre: string;
    area: string;
    estado: string;
  }[];
}

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

// Datos de tareas por área
const TAREAS_POR_AREA = [
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
      }
    ]
  },
  {
    id: 2,
    nombre: 'Inyección',
    color: '#4ECDC4',
    tareas: [
      {
        id: 3,
        descripcion: 'Limpieza de máquinas inyectoras',
        asignado: 'Ana García',
        estado: 'completada',
        prioridad: 'alta',
        startTime: "2024-11-28T07:00:00",
        endTime: "2024-11-28T08:45:00"
      },
      {
        id: 4,
        descripcion: 'Desinfección de moldes',
        asignado: 'Pedro Sánchez',
        estado: 'en_progreso',
        prioridad: 'alta',
        startTime: "2024-11-29T09:30:00",
        endTime: null
      }
    ]
  },
  {
    id: 3,
    nombre: 'Cuarto Frío',
    color: '#45B7D1',
    tareas: [
      {
        id: 5,
        descripcion: 'Limpieza de equipos de refrigeración',
        asignado: 'Carlos Ruiz',
        estado: 'pendiente',
        prioridad: 'alta',
        startTime: null,
        endTime: null
      },
      {
        id: 6,
        descripcion: 'Control de temperatura',
        asignado: 'Laura Torres',
        estado: 'en_progreso',
        prioridad: 'media',
        startTime: "2024-11-29T08:00:00",
        endTime: null
      }
    ]
  }
];

export default function EnterpriseOverviewPage() {
  const router = useRouter();
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
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
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Dona */}
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
              {inventarioCritico.map((item) => (
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
          {TAREAS_POR_AREA.map((area) => (
            <div 
              key={area.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-l-4" style={{ borderColor: area.color }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: area.color }}>
                    {area.nombre}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {area.tareas.length} tareas
                  </span>
                </div>
                <div className="space-y-4">
                  {area.tareas.map((tarea) => (
                    <div key={tarea.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {tarea.descripcion}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Asignado a {tarea.asignado}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="w-3 h-3" />
                        <span>
                          {tarea.startTime ? new Date(tarea.startTime).toLocaleString() : 'No iniciada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow h-1.5 bg-gray-200 rounded-full">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: tarea.estado === 'completada' ? '100%' : 
                                    tarea.estado === 'en_progreso' ? '50%' : '0%',
                              backgroundColor: area.color
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: area.color }}>
                          {tarea.estado === 'completada' ? '100%' : 
                           tarea.estado === 'en_progreso' ? '50%' : '0%'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${tarea.prioridad === 'alta' ? 'bg-red-100 text-red-800' : 
                            tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {tarea.prioridad}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${tarea.estado === 'completada' ? 'bg-green-100 text-green-800' : 
                            tarea.estado === 'en_progreso' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {tarea.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}