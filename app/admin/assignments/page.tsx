'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector';
import { toast } from 'react-hot-toast';
import { errorHandler } from '@/app/utils/errorHandler';

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
  due_date: string;
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

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
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

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
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
        const turnoUsuarios = turnosData.reduce((acc, turno) => {
          if (!acc[turno.shift_type]) {
            acc[turno.shift_type] = new Map();
          }
          if (turno.users && turno.users.id) {
            acc[turno.shift_type].set(turno.users.id, turno.users);
          }
          return acc;
        }, {});

        // Formatear los turnos con usuarios únicos
        const turnosFormatted = [
          {
            id: turnosData.find(t => t.shift_type === 'morning')?.id || '',
            nombre: 'Turno A',
            horario: '06:00 - 14:00',
            shift_type: 'morning',
            personasAsignadas: turnoUsuarios['morning'] ? turnoUsuarios['morning'].size : 0,
            enLinea: 0,
            usuarios: turnoUsuarios['morning'] ? Array.from(turnoUsuarios['morning'].values()) : []
          },
          {
            id: turnosData.find(t => t.shift_type === 'afternoon')?.id || '',
            nombre: 'Turno B',
            horario: '14:00 - 22:00',
            shift_type: 'afternoon',
            personasAsignadas: turnoUsuarios['afternoon'] ? turnoUsuarios['afternoon'].size : 0,
            enLinea: 0,
            usuarios: turnoUsuarios['afternoon'] ? Array.from(turnoUsuarios['afternoon'].values()) : []
          },
          {
            id: turnosData.find(t => t.shift_type === 'night')?.id || '',
            nombre: 'Turno C',
            horario: '22:00 - 06:00',
            shift_type: 'night',
            personasAsignadas: turnoUsuarios['night'] ? turnoUsuarios['night'].size : 0,
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

      // Cargar TODAS las salas sin ningún filtro
      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select(`
          *,
          areas:areas (
            id,
            name,
            status
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (salasError) throw salasError;

      if (salasData) {
        // Cargar las tareas para cada sala
        const salasWithTasks = await Promise.all(salasData.map(async (sala) => {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select(`
              id,
              title,
              description,
              status,
              priority,
              created_at,
              due_date,
              start_date,
              end_time,
              start_time,
              assigned_to,
              users!tasks_assigned_to_fkey (
                id,
                first_name,
                last_name
              )
            `)
            .eq('sala_id', sala.id)
            .eq('type', 'assignment')
            .eq('organization_id', userProfile.organization_id)
            .not('status', 'eq', 'cancelled')
            .order('created_at', { ascending: false });

          if (tasksError) {
            console.error('Error loading tasks for sala:', tasksError);
            return {
              id: sala.id,
              nombre: sala.nombre,
              color: getSalaColor(sala.nombre),
              tareas: [],
              areas: (sala.areas || [])
                .filter((area: Area) => area.status === 'active')
                .map((area: Area) => ({
                  id: area.id,
                  name: area.name
                }))
            };
          }

          // Formatear las tareas
          const formattedTasks: Task[] = (tasksData || []).map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            created_at: new Date(task.created_at).toLocaleDateString(),
            due_date: task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
            assigned_to: task.assigned_to,
            assignee: task.users ? {
              first_name: task.users[0]?.first_name,
              last_name: task.users[0]?.last_name
            } : undefined
          }));

          return {
            id: sala.id,
            nombre: sala.nombre,
            color: getSalaColor(sala.nombre),
            tareas: formattedTasks,
            areas: (sala.areas || [])
              .filter((area: Area) => area.status === 'active')
              .map((area: Area) => ({
                id: area.id,
                name: area.name
              }))
          };
        }));

        console.log('Salas con tareas:', salasWithTasks);
        setSalas(salasWithTasks);
      }

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
    try {
      if (!selectedUser || !selectedSala || !selectedArea || !selectedDate || !startTime) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      setIsCreating(true);

      // Debug logs
      console.log('Datos seleccionados:', {
        selectedUser,
        selectedSala,
        selectedArea,
        selectedDate,
        startTime,
        userMap
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // Obtener el organization_id del usuario
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Error al obtener el perfil del usuario');
      }

      // Combinar fecha y hora de inicio
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = startTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Formatear la fecha y hora en el formato correcto para PostgreSQL
      const formattedDateTime = startDateTime.toISOString().split('T')[0] + ' ' + 
                               startDateTime.toTimeString().split(' ')[0];

      // Debug log para el objeto de la asignación
      const newAssignment = {
        title: `Asignación para ${selectedUser}`,
        description: `Tarea asignada para ${selectedUser} en el área seleccionada`,
        organization_id: userProfile.organization_id,
        assigned_to: userMap[selectedUser],
        sala_id: selectedSala,
        area_id: selectedArea,
        start_time: formattedDateTime,
        status: 'pending',
        type: 'assignment'
      };

      console.log('Nueva asignación a crear:', newAssignment);

      const { data: insertData, error: insertError } = await supabase
        .from('tasks')
        .insert([newAssignment])
        .select()
        .single();

      if (insertError) {
        console.error('Error detallado:', insertError);
        throw insertError;
      }

      console.log('Asignación creada:', insertData);

      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setSelectedUser('');
        setSelectedSala(null);
        setSelectedArea('');
        setSelectedDate('');
        setStartTime('');
        loadData();
      }, 2000);

    } catch (error) {
      console.error('Error detallado al crear la asignación:', error);
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

  const handleTaskClick = (tarea: Task) => {
    setSelectedTask(tarea);
    setShowTaskDetailsModal(true);
  };

  const handleTurnoClick = async (turno: Turno) => {
    try {
      // Primero obtener los IDs de usuarios del turno
      const { data: shiftData, error: shiftError } = await supabase
        .from('work_shifts')
        .select('user_id')
        .eq('shift_type', turno.shift_type)
        .eq('status', 'scheduled');

      if (shiftError) throw shiftError;

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

      // Extraer los user_ids únicos
      const userIds = [...new Set(shiftData.map(shift => shift.user_id))].filter(Boolean);

      // Obtener los detalles de los usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      if (usersError) throw usersError;

      if (usersData) {
        setSelectedShiftDetails({
          id: turno.id,
          nombre: turno.nombre,
          horario: turno.horario,
          usuarios: usersData
        });
        setShowShiftDetailsModal(true);
      }
    } catch (error) {
      console.error('Error al cargar usuarios del turno:', error);
      toast.error('Error al cargar los usuarios del turno');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#4263eb] -mx-6 -mt-6 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Gestión de Asignaciones</h1>
        <p className="text-sm text-blue-100">Administra las asignaciones del personal</p>
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
              Agregar Usuario a Turno
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
                Usuario
              </label>
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

      {/* Tareas por Sala */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tareas por Sala</h2>
        <div className="grid grid-cols-3 gap-6">
          {salas.map((sala) => (
            <div 
              key={sala.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
              style={{ borderLeft: `4px solid ${sala.color}` }}
            >
              {/* Encabezado de la sala */}
              <div className="p-4" style={{ backgroundColor: `${sala.color}10` }}>
                <h3 className="font-semibold text-gray-800">{sala.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {sala.tareas.length} tareas pendientes
                </p>
              </div>

              {/* Lista de tareas */}
              <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {sala.tareas.length > 0 ? (
                  <div className="space-y-3">
                    {sala.tareas.map((tarea) => (
                      <div 
                        key={tarea.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        style={{ borderLeftColor: sala.color }}
                        onClick={() => handleTaskClick(tarea)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-800">{tarea.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tarea.priority === 'high' ? 'bg-red-100 text-red-700' :
                            tarea.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {tarea.priority === 'high' ? 'Alta' :
                             tarea.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{tarea.description}</p>
                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Creada: {tarea.created_at}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Vence: {tarea.due_date}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-500">Estado: {tarea.status === 'pending' ? 'Pendiente' : tarea.status === 'in_progress' ? 'En Progreso' : 'Completada'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No hay tareas pendientes</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para agregar usuario a turno */}
      <Dialog 
        open={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-gradient-to-r from-blue-50 to-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-blue-900 mb-4">
              Agregar Usuario a Turno
            </Dialog.Title>

            <div className="space-y-4">
              {/* Selector de Usuario */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Usuario
                </label>
                <select
                  className="w-full p-2 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedShiftUser}
                  onChange={(e) => setSelectedShiftUser(e.target.value)}
                >
                  <option value="">Seleccionar Usuario</option>
                  {usuarios.map((usuario, index) => (
                    <option key={index} value={usuario}>{usuario}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Turno */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Turno
                </label>
                <select
                  className="w-full p-2 border-blue-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                >
                  <option value="">Seleccionar Turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} ({turno.horario})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={addUserToShift}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4263eb] rounded-lg hover:bg-[#364fc7]"
                >
                  Agregar
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de detalles de tarea */}
      <Dialog 
        open={showTaskDetailsModal} 
        onClose={() => setShowTaskDetailsModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6 shadow-xl">
            {selectedTask && (
              <>
                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4 flex justify-between items-start">
                  <div>
                    <h3>{selectedTask.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedTask.assignee ? `Asignado a: ${selectedTask.assignee.first_name} ${selectedTask.assignee.last_name}` : 'Sin asignar'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedTask.priority === 'high' ? 'Alta' :
                     selectedTask.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Descripción</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedTask.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Fecha de Creación</h4>
                      <p className="text-gray-600">{selectedTask.created_at}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</h4>
                      <p className="text-gray-600">{selectedTask.due_date || 'No especificada'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Estado</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedTask.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedTask.status === 'pending' ? 'Pendiente' :
                       selectedTask.status === 'in_progress' ? 'En Progreso' :
                       'Completada'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowTaskDetailsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de detalles del turno */}
      <Dialog 
        open={showShiftDetailsModal} 
        onClose={() => setShowShiftDetailsModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
            {selectedShiftDetails && (
              <>
                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3>{selectedShiftDetails.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1">{selectedShiftDetails.horario}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      selectedShiftDetails.nombre === 'Turno A' ? 'bg-blue-100 text-blue-700' :
                      selectedShiftDetails.nombre === 'Turno B' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedShiftDetails.usuarios.length} usuarios
                    </div>
                  </div>
                </Dialog.Title>

                <div className="space-y-4">
                  {selectedShiftDetails.usuarios.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {selectedShiftDetails.usuarios.map((usuario) => (
                        <div key={usuario.id} className="py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {usuario.avatar_url ? (
                              <img 
                                src={usuario.avatar_url} 
                                alt={`${usuario.first_name} ${usuario.last_name}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              `${usuario.first_name[0]}${usuario.last_name[0]}`
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {usuario.first_name} {usuario.last_name}
                            </h4>
                            <p className="text-sm text-gray-500">Usuario asignado</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay usuarios asignados a este turno
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowShiftDetailsModal(false);
                      setShowAddUserModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#4263eb] rounded-lg hover:bg-[#364fc7] transition-colors"
                  >
                    Agregar Usuario
                  </button>
                  <button
                    onClick={() => setShowShiftDetailsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 