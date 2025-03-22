'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector';
import { toast } from 'react-hot-toast';
import { errorHandler } from '@/app/utils/errorHandler';
import { motion } from 'framer-motion';
import { taskService } from '@/app/services/taskService';

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
  // Formatear fecha actual para mostrarla
  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Filtrar salas que tienen tareas
  const salasWithTasks = salas.filter(sala => sala.tareas.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <h2 className="text-lg font-semibold mb-4">Tareas por Sala</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-gray-500 italic flex items-center"
        >
          <svg className="w-4 h-4 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          {formattedDate}
        </motion.div>
      </div>

      {salasWithTasks.length === 0 ? (
        <motion.div 
          className="py-20 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-500">No hay tareas para hoy</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            No hay tareas asignadas para las salas en el día de hoy. Las tareas aparecerán aquí según se vayan creando para la fecha actual.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {salasWithTasks.map((sala, index) => (
            <motion.div
              key={sala.id}
              className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <div className="absolute top-0 right-0 left-0 h-1" style={{ backgroundColor: sala.color }} />
              
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: `${sala.color}15` }}>
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: sala.color }} />
                  </div>
                  <h3 className="ml-3 font-semibold text-gray-800">{sala.nombre}</h3>
                </div>
                
                <div className="space-y-3 mt-4">
                  {sala.tareas.slice(0, 3).map((tarea, taskIndex) => {
                    const isCompleted = tarea.status === 'completed';
                    const isInProgress = tarea.status === 'in_progress';
                    
                    return (
                      <motion.div 
                        key={tarea.id}
                        className={`p-3 rounded-lg border ${
                          isCompleted ? 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50' : 
                          isInProgress ? 'border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50' :
                          'border-gray-100 bg-gradient-to-r from-gray-50 to-white'
                        } hover:shadow-sm transition-all`}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                          completed: { 
                            backgroundColor: "rgba(209, 250, 229, 0.6)", 
                            borderColor: "rgba(167, 243, 208, 1)"
                          }
                        }}
                        initial="hidden"
                        animate={isCompleted ? ["visible", "completed"] : "visible"}
                        whileHover={{ 
                          y: -2, 
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                        }}
                        transition={{ 
                          duration: 0.3, 
                          delay: 0.1 * taskIndex + 0.3 * index 
                        }}
                        onClick={() => onTaskClick(tarea)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center">
                              <motion.div 
                                className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center border-2 ${
                                  isCompleted ? 'border-green-500 bg-green-100' : 
                                  isInProgress ? 'border-blue-500 bg-blue-100' :
                                  'border-gray-300 bg-gray-100'
                                }`}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                              >
                                {isCompleted && (
                                  <motion.svg 
                                    viewBox="0 0 24 24" 
                                    className="w-3 h-3 text-green-500"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  >
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                  </motion.svg>
                                )}
                              </motion.div>
                              <h4 className={`font-medium text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {tarea.title}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-6 mt-1">{tarea.description}</p>
                          </div>
                          
                          <motion.span 
                            className={`text-xs px-2 py-1 ml-2 flex-shrink-0 rounded-full font-medium ${
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isInProgress ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 * taskIndex + 0.4 * index }}
                          >
                            {isCompleted ? 'Completado' :
                             isInProgress ? 'En Progreso' : 'Pendiente'}
                          </motion.span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {sala.tareas.length > 3 && (
                  <motion.div 
                    className="mt-3 p-2 text-center text-indigo-600 hover:text-indigo-800 cursor-pointer rounded-lg hover:bg-indigo-50 font-medium flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
        </div>
      )}
    </div>
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

  const handleCreateAssignment = async () => {
    setIsCreating(true);
    try {
      // Validación inicial
      if (selectedDeepTasks) {
        if (selectedUsers.length === 0 || !selectedSala || !selectedArea || !selectedDate || !startTime) {
          toast.error('Por favor complete todos los campos y seleccione al menos un usuario');
          return;
        }
      } else {
        if (!selectedUser || !selectedSala || !selectedArea || !selectedDate || !startTime) {
          toast.error('Por favor complete todos los campos');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Error al obtener el perfil del usuario');

      // Formatear la fecha y hora correctamente
      const [hours, minutes] = startTime.split(':');
      const formattedTime = `${hours}:${minutes}`;

      // Obtener información de sala y área
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

      if (selectedDeepTasks) {
        // Obtener las tareas profundas activas
        const { data: deepTasks, error: deepTasksError } = await supabase
          .from('deep_tasks')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: true });

        if (deepTasksError) throw deepTasksError;

        if (!deepTasks || deepTasks.length === 0) {
          toast.error('No hay tareas profundas configuradas');
          return;
        }

        // Crear una asignación por cada usuario seleccionado
        for (const userName of selectedUsers) {
          const taskData = {
            title: `Limpieza Profunda - ${salaInfo?.nombre || ''} - ${areaInfo?.name || ''}`,
            description: `Tarea de limpieza profunda asignada a ${userName}`,
            organization_id: userProfile.organization_id,
            assigned_to: userMap[userName],
            sala_id: selectedSala,
            area_id: selectedArea,
            start_date: selectedDate,
            start_time: formattedTime,
            status: 'pending',
            type: 'deep_cleaning',
            created_by: user.id,
            priority: 'medium',
            deep_tasks: deepTasks.map((task, index) => ({
              id: task.id,
              name: task.name,
              description: task.description,
              step: index + 1,
              status: 'pending',
              completed_at: null
            }))
          };

          const { error: insertError } = await supabase
            .from('tasks')
            .insert([taskData]);

          if (insertError) throw insertError;
        }

        toast.success(`Se crearon ${selectedUsers.length} asignaciones de limpieza profunda`);
      } else {
        // Insertar una única asignación normal
        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            title: `${salaInfo?.nombre || ''} - ${areaInfo?.name || ''}`,
            description: `Tarea asignada para ${selectedUser}`,
            organization_id: userProfile.organization_id,
            assigned_to: userMap[selectedUser],
            sala_id: selectedSala,
            area_id: selectedArea,
            start_date: selectedDate,
            start_time: formattedTime,
            status: 'pending',
            type: 'assignment',  // Asegurarnos de que es una tarea normal
            created_by: user.id,
            priority: 'medium',
            deep_tasks: null  // Explícitamente establecer deep_tasks como null para tareas normales
          });

        if (insertError) throw insertError;
        toast.success('Asignación creada exitosamente');
      }

      // Mostrar animación y resetear el formulario
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setSelectedUser('');
        setSelectedUsers([]);
        setSelectedSala(null);
        setSelectedArea('');
        setSelectedDate('');
        setStartTime('');
        setSelectedDeepTasks(false);
        loadData();
      }, 2000);

    } catch (error) {
      console.error('Error al crear la asignación:', error);
      toast.error('Error al crear la asignación');
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
          <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg shadow-sm space-y-4 relative">
            {/* Animación de éxito */}
            {showSuccessAnimation && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-4 transform scale-110 transition-all duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <svg 
                      className="w-12 h-12 text-green-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      style={{
                        animation: 'checkmark 0.4s ease-in-out forwards'
                      }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-medium text-green-600 animate-pulse">
                    ¡Asignación creada con éxito!
                  </p>
                </div>
              </div>
            )}

            <style jsx>{`
              @keyframes checkmark {
                0% {
                  stroke-dashoffset: 50;
                  opacity: 0;
                  transform: scale(0.8);
                }
                100% {
                  stroke-dashoffset: 0;
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>

            {/* Usuario */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {selectedDeepTasks ? 'Usuarios' : 'Usuario'}
              </label>
              
              {selectedDeepTasks ? (
                // Selector múltiple mejorado para tareas profundas
                <div className="space-y-2">
                  <div className="max-h-[200px] overflow-y-auto border border-blue-100 rounded-lg bg-white divide-y">
                    {usuarios.map((usuario) => (
                      <label
                        key={usuario}
                        className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors"
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
                      </label>
                    ))}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map(user => (
                        <span
                          key={user}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {user}
                          <button
                            type="button"
                            onClick={() => setSelectedUsers(selectedUsers.filter(u => u !== user))}
                            className="ml-1 inline-flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedUsers([])}
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        Limpiar selección
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Selector único para tareas normales
                <select 
                  className="w-full p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Seleccionar Usuario</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario} value={usuario}>{usuario}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Sala y Área */}
            <SalaAreaSelector
              onSalaChange={(sala) => {
                setSelectedSala(sala?.id || null);
              }}
              onAreaChange={(area) => {
                setSelectedArea(area?.id || '');
              }}
              className="space-y-4"
            />

            {/* Fecha y Hora */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha y Hora de Inicio
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="flex-1 p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <input
                  type="time"
                  className="w-32 p-2.5 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Hora de inicio"
                />
              </div>
            </div>

            {/* Switch para Tareas Profundas */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Incluir Tareas Profundas
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={selectedDeepTasks}
                className={`${
                  selectedDeepTasks ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                onClick={() => setSelectedDeepTasks(!selectedDeepTasks)}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    selectedDeepTasks ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>

            {/* Botón de Crear Asignación */}
            <div className="mt-6 relative">
              <button
                onClick={handleCreateAssignment}
                className={`w-full py-3 text-white rounded-lg transition-all duration-300 relative ${
                  isCreating 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : showSuccessAnimation 
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-[#4263eb] hover:bg-[#364fc7]'
                }`}
                disabled={isCreating}
              >
                {isCreating ? 'Creando...' : 'Crear Asignación'}
              </button>
            </div>

            <style jsx>{`
              @keyframes slideIn {
                from {
                  transform: translateY(-100%);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Reemplazar la sección de Tareas por Sala con el nuevo componente */}
      <TareasPorSala salas={salas} onTaskClick={handleTaskClick} />
    </div>
  );
}