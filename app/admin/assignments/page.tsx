'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector';
import { toast } from 'react-hot-toast';
import { errorHandler } from '@/app/utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { taskService } from '@/app/services/taskService';
import { Database } from '@/app/types/supabase';

interface WorkShiftData {
  id: string;
  shift_type: 'morning' | 'afternoon' | 'night';
  start_time: string;
  end_time: string;
  user_id: string | null;
}

interface Turno {
  id: string;
  nombre: string;
  horario: string;
  personasAsignadas: number;
  enLinea: number;
  shift_type: 'morning' | 'afternoon' | 'night';
  usuarios: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to?: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  start_date?: string;
  start_time?: string;
  due_date?: string;
  sala_id?: string;
  area_id?: string;
  sala?: {
    id: string;
    nombre: string;
  };
  area?: {
    id?: string;
    name?: string;
  };
}

interface SalaData {
  id: string;
  nombre: string;
  areas: Area[];
}

interface Sala {
  id: string;
  nombre: string;
  color: string;
  tareas: Task[];
  areas: Area[];
}

interface WorkShiftWithUsers {
  id: string;
  nombre: string;
  horario: string;
  usuarios: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  }[];
}

interface Area {
  id: string;
  name: string;
  description?: string | null;
  organization_id: string;
  parent_id?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

interface AreaWithSala {
  id: string;
  name: string;
  sala_id: string;
  salas: {
    id: string;
    nombre: string;
    areas: Area[];
  };
}

interface ShiftWithUsers {
  id: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

interface ShiftHours {
  start: string;
  end: string;
}

interface ShiftHoursState {
  morning: ShiftHours;
  afternoon: ShiftHours;
  night: ShiftHours;
}

interface ShiftHourData {
  organization_id: string;
  shift_type: 'morning' | 'afternoon' | 'night';
  start_time: string;
  end_time: string;
}

// Función para formatear la hora en formato militar simple
const formatTime = (time: string): string => {
  if (!time) return '';
  // Remover los segundos y mantener solo horas y minutos
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

// Componente de tareas por sala con animaciones
function TareasPorSala({ salas, onTaskClick }: { salas: Sala[], onTaskClick: (task: Task) => void }) {
  // Formatear la fecha actual para mostrarla
  const today = new Date();
  const formattedToday = today.toLocaleDateString('es-ES', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Filtrar salas que tienen tareas
  const salasConTareas = salas.filter(sala => sala.tareas && sala.tareas.length > 0);

  // Definir variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 80, 
        damping: 15 
      }
    },
    hover: {
      y: -10,
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }
    },
    tap: { scale: 0.98 }
  };
  
  const taskVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }),
    hover: {
      scale: 1.03,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-lg p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
          className="flex items-center"
        >
          <div className="bg-indigo-50 p-2 rounded-lg mr-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Tareas por Sala</h2>
            <p className="text-sm text-gray-500">Asignaciones programadas para hoy</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          {formattedToday}
        </motion.div>
      </div>

      {salasConTareas.length === 0 ? (
        <motion.div 
          className="py-20 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <div className="relative">
            <motion.div 
              className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              animate={{ 
                boxShadow: ["0px 0px 0px rgba(0,0,0,0.1)", "0px 0px 20px rgba(0,0,0,0.2)", "0px 0px 0px rgba(0,0,0,0.1)"],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
            </motion.div>
            <motion.div 
              className="absolute -right-2 -top-2 bg-blue-100 rounded-full p-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </motion.div>
          </div>
          <motion.h3 
            className="text-lg font-medium text-gray-700 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            No hay tareas programadas para hoy
          </motion.h3>
          <motion.p 
            className="text-sm text-gray-500 max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Las tareas aparecerán aquí cuando se creen asignaciones para la fecha actual. Puedes crear una nueva asignación usando el formulario.
          </motion.p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {salasConTareas.map((sala, index) => (
            <motion.div
              key={sala.id}
              className="relative overflow-hidden bg-white rounded-xl border border-gray-100 shadow-md"
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              custom={index}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r" 
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${sala.color}, ${sala.color}CC)` 
                }}
              />
              
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className="h-12 w-12 rounded-full flex items-center justify-center mr-3" 
                    style={{ backgroundColor: `${sala.color}15` }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" 
                      style={{ backgroundColor: sala.color }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                  </div>
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-gray-800">{sala.nombre}</h3>
                    <div className="text-sm text-gray-500">{sala.tareas.length} tareas asignadas</div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-5">
                  {sala.tareas.slice(0, 3).map((tarea, taskIndex) => {
                    const isCompleted = tarea.status === 'completed';
                    const isInProgress = tarea.status === 'in_progress';
                    
                    return (
                      <motion.div 
                        key={tarea.id}
                        variants={taskVariants}
                        className={`border-l-4 ${isCompleted ? 'border-gray-300' : 'border-blue-500'} 
                                    p-3 bg-white rounded-md shadow mb-2`}
                        whileHover={{ scale: 1.02, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                        onClick={() => onTaskClick(tarea)}
                      >
                        <h4 className={`font-medium text-sm truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {sala.nombre} - {tarea.area ? tarea.area.name : ''}
                              </h4>
                        
                        {tarea.start_date && (
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Fecha de inicio:</span> {formatDate(tarea.start_date)}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {tarea.assignee ? 
                            `${tarea.assignee.first_name} ${tarea.assignee.last_name}` : 
                            'Operador 1'}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
                
                {sala.tareas.length > 3 && (
                  <motion.div 
                    className="mt-4 p-2 text-center text-blue-600 hover:text-blue-800 cursor-pointer rounded-lg hover:bg-blue-50 font-medium flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span>Ver todas ({sala.tareas.length})</span>
                    <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Componente para el modal de detalles de tarea
function TaskDetailsModal({ show, task, onClose }: { show: boolean; task: Task | null; onClose: () => void }) {
  // Definir variantes de animación para el modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 } 
    }
  };

  // Si no hay tarea o no se debe mostrar, no renderizar nada
  if (!show || !task) return null;

  // Función para formatear una fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Determinar el color de la insignia de estado
  const statusColor = task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800';
  
  // Texto del estado en español
  const statusText = task.status === 'completed' ? 'Completada' :
                     task.status === 'in_progress' ? 'En progreso' :
                     'Pendiente';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div 
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
            <h3 className="text-xl font-bold">
              {task.sala?.nombre || ''} {task.area ? `- ${task.area.name}` : ''}
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              {task.assignee ? 
                `${task.assignee.first_name} ${task.assignee.last_name}` : 
                'Sin asignar'}
            </p>
          </div>
          
          {/* Contenido */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className={`text-sm mt-1 px-2 py-1 rounded-full inline-block ${statusColor}`}>
                  {statusText}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prioridad</p>
                <p className="text-sm font-medium mt-1 capitalize">
                  {task.priority === 'high' ? 'Alta' : 
                   task.priority === 'medium' ? 'Media' : 'Baja'}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Fecha de inicio</p>
              <p className="text-sm font-medium mt-1">
                {formatDate(task.start_date)}
                {task.start_time && ` a las ${task.start_time}`}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Fecha de creación</p>
              <p className="text-sm font-medium mt-1">
                {task.created_at ? formatDate(task.created_at) : 'No disponible'}
              </p>
            </div>
            
            {task.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Descripción</p>
                <p className="text-sm mt-1">{task.description}</p>
        </div>
      )}
    </div>
          
          {/* Botón de cerrar */}
          <div className="border-t border-gray-200 p-4 flex justify-end">
            <motion.button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedShiftUser, setSelectedShiftUser] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showShiftDetailsModal, setShowShiftDetailsModal] = useState(false);
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<WorkShiftWithUsers | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDeepTasks, setSelectedDeepTasks] = useState(false);
  // Nuevas variables de estado requeridas
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [isFormError, setIsFormError] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [createError, setCreateError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignmentCreated, setAssignmentCreated] = useState(false);
  const [selectedCleaningAreas, setSelectedCleaningAreas] = useState<string[]>([]);

  // Update the state definition with the proper type
  const [shiftHours, setShiftHours] = useState<ShiftHoursState>({
    morning: { start: '06:00', end: '14:00' },
    afternoon: { start: '14:00', end: '22:00' },
    night: { start: '22:00', end: '06:00' }
  });

  const [tempShiftHours, setTempShiftHours] = useState<ShiftHoursState>({
    morning: { start: '06:00', end: '14:00' },
    afternoon: { start: '14:00', end: '22:00' },
    night: { start: '22:00', end: '06:00' }
  });

  const supabase = createClientComponentClient();

  // Update the loadShiftHours function with proper types
  const loadShiftHours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) return;

      const { data: shiftHoursData } = await supabase
        .from('shift_hours')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      if (shiftHoursData && shiftHoursData.length > 0) {
        const formattedHours: ShiftHoursState = {
          morning: { start: '06:00', end: '14:00' },
          afternoon: { start: '14:00', end: '22:00' },
          night: { start: '22:00', end: '06:00' }
        };

        (shiftHoursData as ShiftHourData[]).forEach(shift => {
          const key = shift.shift_type;
          formattedHours[key] = { 
            start: shift.start_time, 
            end: shift.end_time 
          };
        });

        setShiftHours(formattedHours);
      }
    } catch (error) {
      console.error('Error loading shift hours:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadShiftHours(); // Add this line to load shift hours
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClientComponentClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Primero cargar los horarios de los turnos
      const { data: shiftHoursData } = await supabase
        .from('shift_hours')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      // Crear un objeto con los horarios por tipo de turno
      const shiftHoursByType = {
        morning: { start: '06:00', end: '14:00' },
        afternoon: { start: '14:00', end: '22:00' },
        night: { start: '22:00', end: '06:00' }
      };

      if (shiftHoursData) {
        shiftHoursData.forEach((shift: ShiftHourData) => {
          // Usar type assertion para indicar que shift.shift_type es una clave válida
          const shiftType = shift.shift_type as keyof ShiftHoursState;
          shiftHoursByType[shiftType] = {
            start: shift.start_time,
            end: shift.end_time
          };
        });
      }

      // Cargar turnos con usuarios
      const { data: turnosData } = await supabase
        .from('work_shifts')
        .select(`
          id,
          shift_type,
          start_time,
          end_time,
          user_id,
          users!work_shifts_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'scheduled');

      if (turnosData) {
        // Crear un mapa para agrupar usuarios únicos por tipo de turno
        const turnoUsuarios = turnosData.reduce((acc: { [key: string]: Map<string, any> }, turno) => {
          if (!acc[turno.shift_type]) {
            acc[turno.shift_type] = new Map();
          }
          if (turno.users && Array.isArray(turno.users) && turno.users.length > 0) {
            // Iteramos sobre cada usuario en el array
            turno.users.forEach(user => {
              if (user && user.id) {
                acc[turno.shift_type].set(user.id, user);
              }
            });
          }
          return acc;
        }, {});

        // Formatear los turnos con usuarios únicos y horarios dinámicos
        const turnosFormatted = [
          {
            id: turnosData.find(t => t.shift_type === 'morning')?.id || '',
            nombre: 'Turno A',
            horario: `${formatTime(shiftHoursByType.morning.start)} - ${formatTime(shiftHoursByType.morning.end)}`,
            shift_type: 'morning' as const,
            personasAsignadas: turnoUsuarios['morning']?.size || 0,
            enLinea: 0,
            usuarios: turnoUsuarios['morning'] ? Array.from(turnoUsuarios['morning'].values()) : []
          },
          {
            id: turnosData.find(t => t.shift_type === 'afternoon')?.id || '',
            nombre: 'Turno B',
            horario: `${formatTime(shiftHoursByType.afternoon.start)} - ${formatTime(shiftHoursByType.afternoon.end)}`,
            shift_type: 'afternoon' as const,
            personasAsignadas: turnoUsuarios['afternoon']?.size || 0,
            enLinea: 0,
            usuarios: turnoUsuarios['afternoon'] ? Array.from(turnoUsuarios['afternoon'].values()) : []
          },
          {
            id: turnosData.find(t => t.shift_type === 'night')?.id || '',
            nombre: 'Turno C',
            horario: `${formatTime(shiftHoursByType.night.start)} - ${formatTime(shiftHoursByType.night.end)}`,
            shift_type: 'night' as const,
            personasAsignadas: turnoUsuarios['night']?.size || 0,
            enLinea: 0,
            usuarios: turnoUsuarios['night'] ? Array.from(turnoUsuarios['night'].values()) : []
          }
        ];

        console.log('Turnos procesados:', turnosFormatted);
        setTurnos(turnosFormatted);
      }

      // Cargar usuarios
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      if (usersData) {
        const userList = usersData.map(u => ({
          id: u.id,
          fullName: `${u.first_name} ${u.last_name}`
        }));
        setUsuarios(userList.map(u => u.fullName));
        const newUserMap = userList.reduce((acc, user) => ({
          ...acc,
          [user.fullName]: user.id
        }), {} as Record<string, string>);
        setUserMap(newUserMap);
      }

      // Cargar salas con tareas del día actual usando el servicio compartido
      const salasWithTasks = await taskService.loadTodayTasksGroupedBySala();
      
      // Añadir el color a cada sala
      const salasWithColors = salasWithTasks.map(sala => ({
        ...sala,
        color: getSalaColor(sala.nombre),
      }));

      console.log('Salas con tareas para hoy (usando servicio compartido):', salasWithColors);
      setSalas(salasWithColors);

    } catch (error: any) {
      console.error('Error loading data:', error);
      errorHandler.logError('loadData', error);
      toast.error(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getSalaColor = (salaNombre: string): string => {
    const colorMap: { [key: string]: string } = {
      'MEDICINA DE VARONES': '#4F46E5',      // Índigo vibrante
      'MEDICINA DE MUJERES': '#EC4899',      // Rosa vibrante
      'SALA DE PARTOS': '#8B5CF6',          // Púrpura vibrante
      'SALÓN DE OPERACIONES': '#06B6D4',    // Cyan vibrante
      'SALA DE EMERGENCIAS': '#EF4444',     // Rojo vibrante
      'NUTRICION Y DIETETICA': '#10B981',   // Esmeralda vibrante
      'RADIOLOGIA / USG': '#3B82F6',        // Azul vibrante
      'OBSTETRICIA A': '#F59E0B',          // Ámbar vibrante
      'PEDIATRIA': '#6366F1',              // Violeta vibrante
      'PSIQUIATRIA': '#8B5CF6',            // Púrpura vibrante
      'UCI': '#DC2626',                    // Rojo intenso
      'PATOLOGÍA': '#059669',              // Verde esmeralda
      'AREAS ADMINISTRATIVAS': '#0EA5E9',   // Azul cielo vibrante
      'CLINICA DE HERIDAS': '#F43F5E',     // Rosa rojizo vibrante
      'FARMACIA': '#8B5CF6',               // Púrpura vibrante
      'CENTRAL DE EQUIPOS': '#14B8A6'      // Verde azulado vibrante
    };

    return colorMap[salaNombre] || '#6B7280'; // Color por defecto
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validación de campos requeridos - eliminamos título y descripción de la validación
    if (!selectedSala || !selectedArea || !selectedDate || !selectedUser) {
      setIsFormError(true);
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Obtener el usuario autenticado y su organización
      const supabase = createClientComponentClient<Database>();
      const userResponse = await supabase.auth.getUser();
      const user = userResponse.data.user;
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (!userProfile || !userProfile.organization_id) {
        throw new Error("Información de organización no disponible");
      }

      // Obtener información de sala y área para crear un título automático
      const { data: salaInfo } = await supabase
        .from('salas')
        .select('nombre')
        .eq('id', selectedSala)
        .single();
        
      const { data: areaInfo } = await supabase
        .from('areas')
        .select('name')
        .eq('id', selectedArea)
        .single();
        
      const generatedTitle = `${salaInfo?.nombre || ''} - ${areaInfo?.name || ''}`;
      
      // Preparar los datos de la tarea básica con título generado automáticamente
      const taskData = {
        title: generatedTitle,
        description: `Tarea asignada a ${selectedUser}`,
        status: 'pending',
        priority: 'medium', // Valor predeterminado
        created_at: new Date().toISOString(),
        start_date: selectedDate,
        // Ajustar la fecha de vencimiento para compensar el problema de zona horaria
        // Asegura que la tarea aparezca en el día seleccionado en el calendario
        due_date: selectedDate,
        sala_id: selectedSala,
        area_id: selectedArea,
        assigned_to: userMap[selectedUser],
        organization_id: userProfile.organization_id,
        // Usar tipo 'assignment' para que aparezca como asignación, pero también en el calendario
        type: 'assignment',
        start_time: selectedStartTime || null,
        end_time: null // No establecer hora de finalización al crear la tarea
      };
      
      // Manejar los casos de limpieza profunda y asignaciones normales
      if (selectedDeepTasks) {
        // Para limpieza profunda, crear tarea principal
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            ...taskData,
            title: `Limpieza profunda: ${generatedTitle}`,
            type: 'assignment' // Cambiado para mantener consistencia
          }])
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const parentTaskId = data[0].id;
          
          // Crear subtareas para cada área de limpieza seleccionada
          for (const area of selectedCleaningAreas) {
            await supabase
              .from('deep_tasks')
              .insert([{
                task_id: parentTaskId,
                area_name: area,
                status: 'pending',
                organization_id: userProfile.organization_id
              }]);
          }
        }
      } else {
        // Asignación normal, crear una sola tarea
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);
        
        if (error) throw error;
      }
      
      // Resetear el formulario y cerrar el modal
      resetForm();
      setShowCreateModal(false);
      setAssignmentCreated(true);
      
      // Recargar las asignaciones para mostrar la nueva
      loadAssignments();
      
    } catch (error) {
      console.error("Error al crear la asignación:", error);
      setCreateError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const addUserToShift = async () => {
    try {
      if (!selectedShiftUser || !selectedTurno) {
        toast.error('Selecciona un turno y un usuario');
        return;
      }

      const userId = userMap[selectedShiftUser];
      
      if (!userId) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Obtener el organization_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Obtener el turno seleccionado
      const selectedTurnoData = turnos.find(t => t.id === selectedTurno);
      if (!selectedTurnoData) {
        toast.error('Turno no encontrado');
        return;
      }

      // Obtener la fecha actual
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear la hora a medianoche

      // Definir los horarios según el tipo de turno
      let startDateTime = new Date(today);
      let endDateTime = new Date(today);

      switch (selectedTurnoData.shift_type) {
        case 'morning':
          startDateTime.setHours(6, 0, 0);
          endDateTime.setHours(14, 0, 0);
          break;
        case 'afternoon':
          startDateTime.setHours(14, 0, 0);
          endDateTime.setHours(22, 0, 0);
          break;
        case 'night':
          startDateTime.setHours(22, 0, 0);
          endDateTime.setHours(6, 0, 0);
          endDateTime.setDate(endDateTime.getDate() + 1); // Añadir un día para el turno nocturno
          break;
        default:
          toast.error('Tipo de turno no válido');
          return;
      }

      // Verificar si el usuario ya está asignado a este tipo de turno
      const { data: existingAssignment } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', userId)
        .eq('shift_type', selectedTurnoData.shift_type)
        .eq('status', 'scheduled')
        .single();

      if (existingAssignment) {
        toast.error('Este usuario ya está asignado a este turno');
        return;
      }

      // Crear una nueva asignación para el usuario
      const { error: insertError } = await supabase
        .from('work_shifts')
        .insert([{
          organization_id: userProfile.organization_id,
          user_id: userId,
          shift_type: selectedTurnoData.shift_type,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled'
        }]);

      if (insertError) throw insertError;

      toast.success('Usuario asignado al turno correctamente');
      setSelectedTurno('');
      setSelectedShiftUser('');
      setShowAddUserModal(false);
      await loadData();
    } catch (error) {
      console.error('Error al asignar usuario al turno:', error);
      toast.error('Error al asignar usuario al turno');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetailsModal(true);
  };

  const handleTurnoClick = async (turno: Turno) => {
    try {
      // Primero obtener el usuario actual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No se encontró el usuario actual');
      }

      // Obtener los usuarios asignados al turno específico desde work_shifts
      const { data: shiftData, error: shiftError } = await supabase
        .from('work_shifts')
        .select(`
          id,
          shift_type,
          main_user:users!work_shifts_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('shift_type', turno.shift_type)
        .eq('status', 'scheduled')
        .not('main_user', 'is', null)
        .neq('user_id', currentUser.id); // Excluir al usuario actual

      if (shiftError) {
        console.error('Error detallado:', shiftError);
        throw shiftError;
      }

      if (!shiftData || shiftData.length === 0) {
        setSelectedShiftDetails({
          id: turno.id,
          nombre: turno.nombre,
          horario: turno.horario,
          usuarios: []
        });
        setShowShiftDetailsModal(true);
        return;
      }

      console.log('Datos de usuarios por turno (excluyendo usuario actual):', shiftData);

      // Filtrar usuarios únicos y válidos
      const usuariosUnicos = shiftData
        .filter(shift => shift.main_user) // Solo incluir registros con usuarios válidos
        .map(shift => shift.main_user)
        .filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );

      console.log('Usuarios únicos filtrados:', usuariosUnicos);

      setSelectedShiftDetails({
        id: turno.id,
        nombre: turno.nombre,
        horario: turno.horario,
        usuarios: usuariosUnicos
      });
      setShowShiftDetailsModal(true);
    } catch (error) {
      console.error('Error al cargar usuarios del turno:', error);
      toast.error('Error al cargar los usuarios del turno');
    }
  };

  const handleShiftHoursUpdate = async () => {
    try {
      if (!tempShiftHours.morning.start || !tempShiftHours.morning.end ||
          !tempShiftHours.afternoon.start || !tempShiftHours.afternoon.end ||
          !tempShiftHours.night.start || !tempShiftHours.night.end) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      setIsCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Primero eliminar los registros existentes
      const { error: deleteError } = await supabase
        .from('shift_hours')
        .delete()
        .eq('organization_id', userProfile.organization_id);

      if (deleteError) throw deleteError;

      // Insertar los nuevos registros
      const { error: insertError } = await supabase
        .from('shift_hours')
        .insert([
          {
            organization_id: userProfile.organization_id,
            shift_type: 'morning',
            start_time: tempShiftHours.morning.start,
            end_time: tempShiftHours.morning.end
          },
          {
            organization_id: userProfile.organization_id,
            shift_type: 'afternoon',
            start_time: tempShiftHours.afternoon.start,
            end_time: tempShiftHours.afternoon.end
          },
          {
            organization_id: userProfile.organization_id,
            shift_type: 'night',
            start_time: tempShiftHours.night.start,
            end_time: tempShiftHours.night.end
          }
        ]);

      if (insertError) throw insertError;

      // Actualizar los horarios en el estado local
      setShiftHours(tempShiftHours);

      // Actualizar los turnos en la interfaz
      const updatedTurnos = turnos.map(turno => {
        let horario = '';
        switch (turno.shift_type) {
          case 'morning':
            horario = `${tempShiftHours.morning.start} - ${tempShiftHours.morning.end}`;
            break;
          case 'afternoon':
            horario = `${tempShiftHours.afternoon.start} - ${tempShiftHours.afternoon.end}`;
            break;
          case 'night':
            horario = `${tempShiftHours.night.start} - ${tempShiftHours.night.end}`;
            break;
        }
        return {
          ...turno,
          horario
        };
      });

      setTurnos(updatedTurnos);
      
      // Recargar los datos actualizados
      await loadData();
      await loadShiftHours();

      toast.success('Horarios actualizados correctamente');
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Error al actualizar los horarios:', error);
      toast.error('Error al actualizar los horarios');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSalaChange = (sala?: { id: string }) => {
    setSelectedSala(sala?.id || null);
  };

  // Añadir función resetForm para limpiar el formulario
  const resetForm = () => {
    setSelectedUser('');
    setSelectedUsers([]);
    setSelectedSala(null);
    setSelectedArea('');
    setSelectedDate('');
    setStartTime('');
    setSelectedDeepTasks(false);
    setSelectedStartTime('');
    setSelectedCleaningAreas([]);
    setIsFormError(false);
  };

  // Función para cargar las asignaciones
  const loadAssignments = async () => {
    await loadData();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="px-6 -mx-6 py-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Asignaciones</h1>
        <p className="text-sm text-gray-600 mt-1">Administra las asignaciones del personal</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Turnos del Personal */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Turnos del Personal</h2>
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Cargando turnos...</div>
            ) : (
              turnos.map((turno) => (
                <div 
                  key={turno.id}
                  className={`p-6 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    turno.nombre === 'Turno A' ? 'bg-blue-50 border-l-4 border-blue-500' :
                    turno.nombre === 'Turno B' ? 'bg-green-50 border-l-4 border-green-500' :
                    'bg-purple-50 border-l-4 border-purple-500'
                  }`}
                  onClick={() => handleTurnoClick(turno)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{turno.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1">{turno.personasAsignadas} personas asignadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium">{turno.horario}</p>
                      <p className="text-sm text-gray-500 mt-1">{turno.enLinea} en línea</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="w-full py-3 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors mt-4"
            >
              Configurar Horarios
            </button>
          </div>
        </div>

        {/* Nueva Asignación */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Nueva Asignación</h2>
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm space-y-4 relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300 
            }}
          >
            {/* Animación de éxito */}
            <AnimatePresence>
            {showSuccessAnimation && (
                <motion.div 
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="flex flex-col items-center space-y-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1.1 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <motion.div 
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: 3, duration: 0.6 }}
                    >
                      <motion.svg 
                      className="w-12 h-12 text-green-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <motion.path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d="M5 13l4 4L19 7"
                      />
                      </motion.svg>
                    </motion.div>
                    <motion.p 
                      className="text-xl font-medium text-green-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.8, 1] }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                    ¡Asignación creada con éxito!
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Usuario */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {selectedDeepTasks ? 'Usuarios' : 'Usuario'}
              </label>
              
              {selectedDeepTasks ? (
                // Selector múltiple mejorado para tareas profundas
                <div className="space-y-2">
                  <motion.div 
                    className="max-h-[200px] overflow-y-auto border border-blue-100 rounded-lg bg-white divide-y"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    {usuarios.map((usuario, index) => (
                      <motion.label
                        key={usuario}
                        className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(usuario)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, usuario]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(u => u !== usuario));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{usuario}</span>
                      </motion.label>
                    ))}
                  </motion.div>
                  <AnimatePresence>
                  {selectedUsers.length > 0 && (
                      <motion.div 
                        className="flex flex-wrap gap-2 mt-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                      {selectedUsers.map(user => (
                          <motion.span
                          key={user}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                          {user}
                            <motion.button
                            type="button"
                            onClick={() => setSelectedUsers(selectedUsers.filter(u => u !== user))}
                            className="ml-1 inline-flex items-center justify-center"
                              whileHover={{ rotate: 90 }}
                              transition={{ duration: 0.2 }}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            </motion.button>
                          </motion.span>
                      ))}
                        <motion.button
                        type="button"
                        onClick={() => setSelectedUsers([])}
                        className="text-xs text-gray-500 hover:text-red-500"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                      >
                        Limpiar selección
                        </motion.button>
                      </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              ) : (
                // Selector único para tareas normales
                <motion.select 
                  className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  whileHover={{ boxShadow: "0 0 0 2px rgba(66, 99, 235, 0.2)" }}
                  whileFocus={{ boxShadow: "0 0 0 3px rgba(66, 99, 235, 0.3)" }}
                  transition={{ duration: 0.2 }}
                >
                  <option value="">Seleccionar Usuario</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </motion.select>
              )}
            </motion.div>

            {/* Sala y Área */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
            <SalaAreaSelector
              onSalaChange={(sala) => {
                setSelectedSala(sala?.id || null);
              }}
              onAreaChange={(area) => {
                setSelectedArea(area?.id || '');
              }}
              className="space-y-4"
            />
            </motion.div>

            {/* Fecha y Hora */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora de Inicio
              </label>
              <div className="flex gap-2 items-center">
                <motion.input
                  type="date"
                  className="flex-1 p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  whileHover={{ boxShadow: "0 0 0 2px rgba(66, 99, 235, 0.2)" }}
                  whileFocus={{ boxShadow: "0 0 0 3px rgba(66, 99, 235, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
                <motion.input
                  type="time"
                  className="w-32 p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  placeholder="Hora de inicio"
                  whileHover={{ boxShadow: "0 0 0 2px rgba(66, 99, 235, 0.2)" }}
                  whileFocus={{ boxShadow: "0 0 0 3px rgba(66, 99, 235, 0.3)" }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>

            {/* Hora de finalización - ELIMINADO */}
            {/* Este campo no debe estar en el formulario de creación, se establecerá cuando se finalice la tarea */}

            {/* Switch para Tareas Profundas */}
            <motion.div 
              className="flex items-center justify-between py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Incluir Tareas Profundas
              </label>
              <motion.button
                type="button"
                role="switch"
                aria-checked={selectedDeepTasks}
                className={`${
                  selectedDeepTasks ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                onClick={() => setSelectedDeepTasks(!selectedDeepTasks)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  animate={{ 
                    translateX: selectedDeepTasks ? 20 : 0,
                    backgroundColor: selectedDeepTasks ? "#ffffff" : "#ffffff"
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </motion.div>

            {/* Opciones de limpieza profunda */}
            <AnimatePresence>
              {selectedDeepTasks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100"
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Áreas de limpieza profunda
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Baños', 'Pisos', 'Ventanas', 'Equipos', 'Mobiliario'].map((area) => (
                      <motion.label 
                        key={area} 
                        className="flex items-center p-2 bg-white rounded-md border border-blue-50 hover:border-blue-200 cursor-pointer"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 246, 255, 0.6)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={selectedCleaningAreas.includes(area)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCleaningAreas([...selectedCleaningAreas, area]);
                            } else {
                              setSelectedCleaningAreas(selectedCleaningAreas.filter(a => a !== area));
                            }
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-700">{area}</span>
                      </motion.label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de Crear Asignación */}
            <motion.div 
              className="mt-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Mensaje de error del formulario */}
              <AnimatePresence>
                {isFormError && (
                  <motion.div 
                    className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Por favor completa todos los campos obligatorios: sala, área, fecha y usuario.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleCreateAssignment}
                className={`w-full py-3 text-white rounded-lg transition-all duration-300 relative ${
                  isCreating 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : showSuccessAnimation 
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-[#4263eb] hover:bg-[#364fc7]'
                }`}
                disabled={isCreating}
                whileHover={isCreating ? {} : { scale: 1.02, boxShadow: "0 4px 12px rgba(66, 99, 235, 0.2)" }}
                whileTap={isCreating ? {} : { scale: 0.98 }}
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </span>
                ) : 'Crear Asignación'}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
            </div>

      {/* Reemplazar la sección de Tareas por Sala con el nuevo componente */}
      <TareasPorSala salas={salas} onTaskClick={handleTaskClick} />

      {/* Modal de detalle de tarea */}
      <TaskDetailsModal
        show={showTaskDetailsModal}
        task={selectedTask}
        onClose={() => setShowTaskDetailsModal(false)}
      />

      {/* Modales para manejo de turnos y configuración */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Configuración de Horarios</h2>
              <motion.button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg mb-6 border border-blue-100">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-700">
                  Configurar los horarios de los turnos para todo el personal. Estos horarios se aplicarán a todas las asignaciones.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div 
                className="p-4 rounded-lg border border-blue-100 bg-blue-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="font-medium mb-2 text-blue-700">Turno A (Mañana)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora inicio</label>
                    <input
                      type="time"
                      value={tempShiftHours.morning.start}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        morning: {
                          ...tempShiftHours.morning,
                          start: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora fin</label>
                    <input
                      type="time"
                      value={tempShiftHours.morning.end}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        morning: {
                          ...tempShiftHours.morning,
                          end: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="p-4 rounded-lg border border-green-100 bg-green-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-medium mb-2 text-green-700">Turno B (Tarde)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora inicio</label>
                    <input
                      type="time"
                      value={tempShiftHours.afternoon.start}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        afternoon: {
                          ...tempShiftHours.afternoon,
                          start: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
          </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora fin</label>
                    <input
                      type="time"
                      value={tempShiftHours.afternoon.end}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        afternoon: {
                          ...tempShiftHours.afternoon,
                          end: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
        </div>
      </div>
              </motion.div>

              <motion.div 
                className="p-4 rounded-lg border border-purple-100 bg-purple-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="font-medium mb-2 text-purple-700">Turno C (Noche)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora inicio</label>
                    <input
                      type="time"
                      value={tempShiftHours.night.start}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        night: {
                          ...tempShiftHours.night,
                          start: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hora fin</label>
                    <input
                      type="time"
                      value={tempShiftHours.night.end}
                      onChange={(e) => setTempShiftHours({
                        ...tempShiftHours,
                        night: {
                          ...tempShiftHours.night,
                          end: e.target.value
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="pt-4 flex justify-end gap-3">
                <motion.button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handleShiftHoursUpdate}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCreating ? 'Actualizando...' : 'Guardar Cambios'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showShiftDetailsModal && selectedShiftDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{selectedShiftDetails.nombre}</h2>
              <motion.button 
                onClick={() => setShowShiftDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-700 font-medium">{selectedShiftDetails.horario}</span>
              </div>
            </div>

            {selectedShiftDetails.usuarios.length === 0 ? (
              <motion.div 
                className="text-center py-8 text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>No hay usuarios asignados a este turno</p>
              </motion.div>
            ) : (
              <div className="divide-y">
                {selectedShiftDetails.usuarios.map((usuario, index) => (
                  <motion.div 
                    key={usuario.id} 
                    className="py-3 flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium mr-3">
                      {usuario.first_name?.[0]}{usuario.last_name?.[0]}
                    </div>
                    <div>
                      <div className="font-medium">{usuario.first_name} {usuario.last_name}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <motion.button
                onClick={() => setShowShiftDetailsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cerrar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Verificar si selectedDeepTasks está activado y mostrar opciones adicionales */}
      {selectedDeepTasks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-blue-50 rounded-lg"
          transition={{ duration: 0.3 }}
        >
          <label className="block text-sm font-medium text-blue-700 mb-2">
            Áreas de limpieza profunda
          </label>
          <div className="space-y-2">
            {['Baños', 'Pisos', 'Ventanas', 'Equipos', 'Mobiliario'].map((area) => (
              <label key={area} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={selectedCleaningAreas.includes(area)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCleaningAreas([...selectedCleaningAreas, area]);
                    } else {
                      setSelectedCleaningAreas(selectedCleaningAreas.filter(a => a !== area));
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{area}</span>
              </label>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}