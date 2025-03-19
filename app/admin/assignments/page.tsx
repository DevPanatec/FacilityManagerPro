'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@headlessui/react';
import { User } from '@supabase/supabase-js';
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector';
import { toast } from 'react-hot-toast';
import { errorHandler } from '@/app/utils/errorHandler';
import { taskService, TaskWithRelations, configureTaskService } from '@/app/lib/services/task.service';

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
  metadata?: { [key: string]: any } | null;
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
  areas: {
    id: string;
    name: string;
  }[];
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
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showShiftDetailsModal, setShowShiftDetailsModal] = useState(false);
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<WorkShiftWithUsers | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeepTasks, setIsDeepTasks] = useState(false);
  const [userProfile, setUserProfile] = useState<{ organization_id: string, role: string } | null>(null);

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
      console.log("Cargando horarios de turnos...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No hay usuario autenticado");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error al obtener perfil:", profileError);
        return;
      }

      if (!userProfile) {
        console.log("No se encontró el perfil del usuario");
        return;
      }

      console.log("Consultando horarios para organización:", userProfile.organization_id);
      
      const { data: shiftHoursData, error: shiftError } = await supabase
        .from('shift_hours')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      if (shiftError) {
        console.error("Error al cargar horarios:", shiftError);
        return;
      }

      console.log("Datos de horarios obtenidos:", shiftHoursData);

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

        console.log("Horarios formateados:", formattedHours);
        setShiftHours(formattedHours);
        setTempShiftHours(JSON.parse(JSON.stringify(formattedHours)));
      }
    } catch (error) {
      console.error('Error loading shift hours:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadShiftHours(); // Cargar los horarios de turnos
    
    // Configurar suscripción al servicio de tareas para actualizaciones automáticas
    if (userProfile?.organization_id) {
      console.log("Configurando servicio de tareas para la organización:", userProfile.organization_id);
      configureTaskService(userProfile.organization_id);
    }
    
    // Realizar un diagnóstico para verificar que se están cargando correctamente las tareas
    const diagnóstico = async () => {
      try {
        if (!userProfile?.organization_id) return;
        
        console.log("Realizando diagnóstico de tareas...");
        // Obtener TODAS las tareas para diagnóstico
        const allTasks = await taskService.getAllTasks(userProfile.organization_id, true);
        
        // Contar tareas por tipo para diagnosticar
        const tasksByType: Record<string, number> = {};
        allTasks.forEach(task => {
          const type = task.type || 'unknown';
          tasksByType[type] = (tasksByType[type] || 0) + 1;
        });
        
        console.log("Distribución total de tareas por tipo:", tasksByType);
        
        // Verificar tareas de tipo 'assignment'
        const assignmentTasks = allTasks.filter(task => task.type === 'assignment');
        console.log(`Hay ${assignmentTasks.length} tareas de tipo 'assignment' en total`);
        
        if (assignmentTasks.length > 0) {
          console.log("Ejemplo de tarea de tipo 'assignment':", assignmentTasks[0]);
        }
      } catch (error) {
        console.error("Error en diagnóstico:", error);
      }
    };
    
    // Ejecutar diagnóstico después de cargar datos
    setTimeout(diagnóstico, 2000);
    
    // Limpiar suscripciones al desmontar
    return () => {
      // Cualquier limpieza necesaria
    };
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carga de datos...");
      
      // 1. Obtener usuario y perfil para determinar la organización
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No autorizado');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setUserProfile(userProfile);

      // Configurar el servicio de tareas para escuchar cambios en tiempo real
      configureTaskService(userProfile.organization_id);

      // 2. Obtener áreas y salas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select(`
          id, 
          name, 
          description,
          status,
          sala_id,
          salas (
            id, 
            nombre,
            areas (
              id, 
              name,
              status
            )
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      if (areasError) {
        throw areasError;
      }
      
      // 3. Cargar los turnos programados
      console.log("Consultando turnos programados...");
      const { data: turnosData, error: turnosError } = await supabase
        .from('work_shifts')
        .select(`
          id,
          shift_type,
          start_time,
          end_time,
          user_id,
          users (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'scheduled');

      if (turnosError) {
        console.error("Error al cargar turnos:", turnosError);
      }

      console.log("Turnos obtenidos:", turnosData);
      
      // Procesamiento de turnos y horarios
      // Primero cargar los horarios
      const { data: shiftHoursData, error: shiftHoursError } = await supabase
        .from('shift_hours')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      // Crear un objeto con los horarios por tipo de turno
      const shiftHoursByType = {
        morning: { start: '06:00', end: '14:00' },
        afternoon: { start: '14:00', end: '22:00' },
        night: { start: '22:00', end: '06:00' }
      };

      if (shiftHoursData && !shiftHoursError) {
        shiftHoursData.forEach((shift: ShiftHourData) => {
          const shiftType = shift.shift_type as keyof ShiftHoursState;
          shiftHoursByType[shiftType] = {
            start: shift.start_time,
            end: shift.end_time
          };
        });
      }

      // Almacenar los horarios de los turnos en el estado
      setShiftHours(shiftHoursByType);
      setTempShiftHours(JSON.parse(JSON.stringify(shiftHoursByType)));

      // Crear un mapa para agrupar usuarios únicos por tipo de turno
      const turnoUsuarios: { [key: string]: Map<string, any> } = {
        morning: new Map(),
        afternoon: new Map(),
        night: new Map()
      };

      // Procesar cada turno para extraer sus usuarios
      if (turnosData) {
        console.log('Procesando datos de turnos:', turnosData);
        
        turnosData.forEach(turno => {
          if (!turno.shift_type || !turnoUsuarios[turno.shift_type]) return;
          
          // Si el usuario existe directamente como campo user_id
          if (turno.user_id) {
            // Inicializar un objeto para los datos del usuario
            let userData = null;
            
            // Manejar diferentes estructuras del campo users
          if (turno.users) {
              if (Array.isArray(turno.users) && turno.users.length > 0) {
                // Si es un array, tomamos el primer usuario
                userData = turno.users[0]; 
              } else if (typeof turno.users === 'object' && turno.users !== null) {
                // Si es un objeto, lo usamos directamente
                userData = turno.users;
              }
            }
            
            // Verificar si tenemos datos completos
            if (userData && typeof userData === 'object') {
              // Manejar caso donde userData es un objeto
              if ('id' in userData && 'first_name' in userData) {
                turnoUsuarios[turno.shift_type].set(turno.user_id, {
                  id: userData.id,
                  first_name: userData.first_name || '',
                  last_name: userData.last_name || '',
                  avatar_url: userData.avatar_url || null
                });
              }
            } else {
              // Si no tenemos datos completos, usar el ID como referencia
              turnoUsuarios[turno.shift_type].set(turno.user_id, {
                id: turno.user_id,
                first_name: 'Usuario',
                last_name: turno.user_id.substring(0, 5),
                avatar_url: null
              });
            }
          }
        });
      }

        // Formatear los turnos con usuarios únicos y horarios dinámicos
        const turnosFormatted = [
          {
          id: turnosData?.find((t: any) => t.shift_type === 'morning')?.id || 'morning',
            nombre: 'Turno A',
            horario: `${formatTime(shiftHoursByType.morning.start)} - ${formatTime(shiftHoursByType.morning.end)}`,
            shift_type: 'morning' as const,
            personasAsignadas: turnoUsuarios['morning']?.size || 0,
            enLinea: 0,
            usuarios: turnoUsuarios['morning'] ? Array.from(turnoUsuarios['morning'].values()) : []
          },
          {
          id: turnosData?.find((t: any) => t.shift_type === 'afternoon')?.id || 'afternoon',
            nombre: 'Turno B',
            horario: `${formatTime(shiftHoursByType.afternoon.start)} - ${formatTime(shiftHoursByType.afternoon.end)}`,
            shift_type: 'afternoon' as const,
            personasAsignadas: turnoUsuarios['afternoon']?.size || 0,
            enLinea: 0,
            usuarios: turnoUsuarios['afternoon'] ? Array.from(turnoUsuarios['afternoon'].values()) : []
          },
          {
          id: turnosData?.find((t: any) => t.shift_type === 'night')?.id || 'night',
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

      // 4. Cargar usuarios
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

      // 6. Obtener todas las salas...
      // ... resto del código existente para cargar salas y tareas
      
      // 3. Obtener todas las salas de la organización con sus áreas
      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select(`
          id,
          nombre,
          areas (
            id,
            name,
            description,
            parent_id,
            status
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (salasError) throw salasError;
      console.log('Salas cargadas:', salasData);

      // Procesar las salas con sus áreas y obtener las tareas
        const salasWithTasks = await Promise.all(salasData.map(async (sala) => {
        try {
          console.log(`Obteniendo tareas para sala ${sala.nombre}`);
          
          // Obtener TODAS las tareas primero para hacer un análisis detallado
          const allTasks = await taskService.getAllTasks(userProfile.organization_id, true);
          
          // Filtrar tareas con lógica específica para la página de asignaciones
          // 1. Debe ser de tipo "assignment"
          // 2. Debe estar asociada a la sala actual
          // 3. Debe tener el metadata que indica que fue creada desde esta página
          const relevantTasks = allTasks.filter(task => {
            const isAssignment = task.type === 'assignment';
            const hasCorrectSala = task.sala_id === sala.id;
            
            // Verificar si tiene el metadata que identifica su origen
            const hasAssignmentSource = 
              task.metadata && 
              typeof task.metadata === 'object' && 
              task.metadata.source === 'assignments_page';
            
            // Para compatibilidad con tareas anteriores, también verificamos el patrón en el título
            const titlePattern = sala.nombre;
            const hasTitlePattern = task.title ? task.title.includes(titlePattern) : false;
            
            return isAssignment && hasCorrectSala && (hasAssignmentSource || hasTitlePattern);
          });
          
          console.log(`Sala ${sala.nombre}: Encontradas ${relevantTasks.length} tareas específicas de asignaciones`);
          
          // Formatear las tareas para esta sala
          const formattedTasks = relevantTasks.map(task => ({
            id: task.id,
            title: task.title || '',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            created_at: task.created_at ? new Date(task.created_at).toLocaleDateString() : '',
            assigned_to: task.assigned_to || undefined,
            assignee: task.assignee ? {
              first_name: task.assignee.first_name || '',
              last_name: task.assignee.last_name || ''
            } : undefined
          } as Task));
          
          // Procesar áreas de manera segura para el tipo
          const safeAreas = (sala.areas || []).map(area => ({
            id: area.id,
            name: area.name,
            status: area.status || 'active'
          }));
          
          const activeAreas = safeAreas
            .filter(area => area.status === 'active')
            .map(area => ({
              id: area.id,
              name: area.name
          }));

          return {
            id: sala.id,
            nombre: sala.nombre,
            color: getSalaColor(sala.nombre),
            tareas: formattedTasks,
            areas: activeAreas
          } as Sala;
        } catch (error) {
          console.error(`Error cargando tareas para sala ${sala.nombre}:`, error);
          
          // Procesar áreas de manera segura para el tipo (caso de error)
          const safeAreas = (sala.areas || []).map(area => ({
            id: area.id,
            name: area.name,
            status: area.status || 'active'
          }));
          
          const activeAreas = safeAreas
            .filter(area => area.status === 'active')
            .map(area => ({
                id: area.id,
                name: area.name
            }));
          
          return {
            id: sala.id,
            nombre: sala.nombre,
            color: getSalaColor(sala.nombre),
            tareas: [],
            areas: activeAreas
          } as Sala;
        }
      }));

      // Corregir el error de tipo filtrando los undefined
      const validSalasWithTasks = salasWithTasks.filter(sala => sala !== undefined) as Sala[];
      
      console.log('Salas con tareas:', validSalasWithTasks);
      setSalas(validSalasWithTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
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
      // Validación inicial
      if (selectedDeepTasks) {
        if (!selectedUsers || selectedUsers.length === 0) {
          toast.error('Selecciona al menos un usuario para asignar tareas profundas');
          return;
        }
      } else {
        // Validación para tareas normales
        if (!selectedStartTime || !selectedUsers || selectedUsers.length === 0 || !selectedRoom || !selectedArea) {
          toast.error('Todos los campos son obligatorios');
          return;
        }
      }

      // Obtener usuario actual y perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No autorizado');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setSubmitting(true);

      // Formato estándar para la hora de inicio
      const formattedStartTime = selectedStartTime ? formatTime(selectedStartTime) : '';

      // Obtener información de la sala seleccionada
      const selectedRoomData = salas.find(sala => sala.id === selectedRoom);
      if (!selectedRoomData) {
        throw new Error('Sala no encontrada');
      }

      const selectedAreaData = selectedRoomData.areas.find(area => area.id === selectedArea);
      if (!selectedAreaData) {
        throw new Error('Área no encontrada');
      }

      // Tener un formato consistente para titular las tareas que creamos desde esta página
      // Este formato nos permitirá identificar las tareas creadas desde aquí
      const titlePrefix = `${selectedRoomData.nombre} - ${selectedAreaData.name}: `;

      if (selectedDeepTasks) {
        // Flujo para tareas profundas
        console.log('Creando tareas de limpieza profunda para los usuarios seleccionados...');

        // Obtener las tareas profundas activas
        const { data: deepTasks, error: deepTasksError } = await supabase
          .from('deep_tasks')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (deepTasksError) {
          throw deepTasksError;
        }

        if (!deepTasks || deepTasks.length === 0) {
          toast.error('No hay tareas profundas configuradas en el sistema');
          setSubmitting(false);
          return;
        }

        let tasksCreated = 0;
        const tasksWithErrors = [];

        // Crear una tarea por cada usuario seleccionado
        for (const userId of selectedUsers) {
          try {
            if (!userId) continue;

            // Validar que el ID de usuario es válido
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', userId)
              .single();

            if (!userData) {
              console.error(`Usuario no encontrado para ID: ${userId}`);
              continue;
            }

            // Construir los datos de la tarea
            const userName = `${userData.first_name} ${userData.last_name}`;
            
          const taskData = {
              title: titlePrefix + `Limpieza profunda asignada a ${userName}`,
              description: `Tarea de limpieza profunda para el área ${selectedAreaData.name} en ${selectedRoomData.nombre}`,
              organization_id: profile.organization_id,
            status: 'pending',
              priority: 'high',
              assigned_to: userId,
              sala_id: selectedRoom,
              area_id: selectedArea,
              type: 'deep_cleaning',  // Tipo específico para tareas profundas
              start_date: new Date().toISOString().split('T')[0],
            created_by: user.id,
              metadata: { source: 'assignments_page', creator: 'assignments_module' }  // Identificador único
            };

            console.log('Insertando tarea profunda:', taskData);

            // Insertar la tarea
            const { data: insertedTask, error: insertError } = await supabase
            .from('tasks')
              .insert(taskData)
              .select()
              .single();

            if (insertError) {
              console.error('Error al insertar tarea profunda:', insertError);
              tasksWithErrors.push(userId);
              continue;
            }

            console.log('Tarea profunda creada con éxito:', insertedTask);
            // Verificar que el tipo se guardó correctamente
            if (insertedTask.type !== 'deep_cleaning') {
              console.warn(`La tarea se creó, pero el tipo guardado es '${insertedTask.type}' en lugar de 'deep_cleaning'`);
            }

            tasksCreated++;
          } catch (error) {
            console.error('Error procesando usuario:', error);
            tasksWithErrors.push(userId);
          }
        }

        // Invalidar caché para refrescar datos
        taskService.invalidateCache();

        // Mensaje de éxito o error basado en resultados
        if (tasksCreated > 0) {
          toast.success(`${tasksCreated} tareas profundas creadas con éxito`);
          if (tasksWithErrors.length > 0) {
            toast.error(`No se pudieron crear tareas para ${tasksWithErrors.length} usuarios`);
          }
      } else {
          toast.error('No se pudo crear ninguna tarea profunda');
        }
      } else {
        // Flujo para tareas normales de asignación
        console.log('Creando tarea de asignación normal...');

        // Crear una tarea con información detallada
        for (const userId of selectedUsers) {
          try {
            if (!userId) continue;

            // Obtener datos del usuario
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', userId)
              .single();

            if (!userData) {
              console.error(`Usuario no encontrado para ID: ${userId}`);
              continue;
            }

            const userName = `${userData.first_name} ${userData.last_name}`;
            
            const taskData = {
              title: titlePrefix + `Asignación regular para ${userName}`,
              description: formattedStartTime 
                ? `Tarea de mantenimiento programada para ${formattedStartTime} en el área ${selectedAreaData.name}`
                : `Tarea de mantenimiento en el área ${selectedAreaData.name}`,
              organization_id: userProfile?.organization_id || profile.organization_id,
            status: 'pending',
              priority: assignmentPriority || 'medium',
              assigned_to: userId,
              sala_id: selectedRoom,
              area_id: selectedArea,
              type: 'assignment',  // Este es el tipo estándar para asignaciones
              deep_task: null,  // Sin tarea profunda asociada
              start_time: formattedStartTime,
              start_date: new Date().toISOString().split('T')[0],
            created_by: user.id,
              metadata: { source: 'assignments_page', creator: 'assignments_module' }  // Identificador único
            };

            console.log('Insertando tarea de asignación:', taskData);

            // Insertar la tarea
            const { data: insertedTask, error: insertError } = await supabase
              .from('tasks')
              .insert(taskData)
              .select()
              .single();

            if (insertError) {
              throw insertError;
            }

            console.log('Tarea creada con éxito:', insertedTask);
            // Verificar que el tipo se guardó correctamente
            if (insertedTask.type !== 'assignment') {
              console.warn(`La tarea se creó, pero el tipo guardado es '${insertedTask.type}' en lugar de 'assignment'`);
            }
          } catch (error) {
            console.error('Error al crear tarea:', error);
            toast.error('Error al crear tarea');
            setSubmitting(false);
            return;
          }
        }

        // Invalidar caché para refrescar los datos
        taskService.invalidateCache();

        // Esperar un momento para que el caché se refresque
      setTimeout(() => {
          // Actualizar la vista
          loadData();
          
          // Restablecer formulario
        setSelectedUsers([]);
          setSelectedRoom('');
        setSelectedArea('');
          setSelectedStartTime('');
          setSelectedDeepTasks(false);
          setAssignmentPriority('medium');
          
          // Mostrar animación de éxito
          toast.success('Asignaciones creadas con éxito');
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
        }, 1000);
      }
    } catch (error) {
      console.error('Error en handleCreateAssignment:', error);
      toast.error('Error al crear la asignación');
    } finally {
      setSubmitting(false);
    }
  };

  const addUserToShift = async () => {
    try {
      if (!selectedShiftUser || !selectedTurno) {
        toast.error('Selecciona un turno y un usuario');
        return;
      }

      console.log('Añadiendo usuario al turno:', {
        usuario: selectedShiftUser,
        turno: selectedTurno
      });

      const userId = userMap[selectedShiftUser];
      
      if (!userId) {
        console.error('Usuario no encontrado en el mapa:', selectedShiftUser);
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

      // Verificar si el usuario ya está asignado a este tipo de turno
      const { data: existingAssignment } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', userId)
        .eq('shift_type', selectedTurno.shift_type)
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
          shift_type: selectedTurno.shift_type,
          start_time: shiftHours[selectedTurno.shift_type].start,
          end_time: shiftHours[selectedTurno.shift_type].end,
          status: 'scheduled'
        }]);

      if (insertError) throw insertError;

      toast.success('Usuario asignado al turno correctamente');
      setSelectedTurno(null);
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
      console.log('Turno seleccionado:', turno);
      console.log('Usuarios en el turno:', turno.usuarios);
      
      // Establecer el turno seleccionado en el estado
      setSelectedTurno(turno);
      
      // Mostrar los detalles del turno y sus usuarios en el modal
        setSelectedShiftDetails({
          id: turno.id,
          nombre: turno.nombre,
          horario: turno.horario,
        usuarios: Array.isArray(turno.usuarios) ? turno.usuarios : []
        });
      
      // Abrir el modal de detalles del turno
        setShowShiftDetailsModal(true);
    } catch (error) {
      console.error('Error al mostrar detalles del turno:', error);
      toast.error('Error al cargar los detalles del turno');
    }
  };

  const handleAddTask = () => {
    if (selectedShiftDetails && selectedTurno) {
      // Asegurar la compatibilidad de tipos al transferir usuarios
      setSelectedTurno({
        id: selectedShiftDetails.id,
        nombre: selectedShiftDetails.nombre,
        horario: selectedShiftDetails.horario,
        shift_type: selectedShiftDetails.id === 'morning' || selectedShiftDetails.id.includes('morning') ? 'morning' :
                   selectedShiftDetails.id === 'afternoon' || selectedShiftDetails.id.includes('afternoon') ? 'afternoon' : 'night',
        personasAsignadas: selectedShiftDetails.usuarios?.length || 0,
        enLinea: 0,
        usuarios: selectedShiftDetails.usuarios.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url === null ? undefined : user.avatar_url
        }))
      });
      
      setShowShiftDetailsModal(false);
      setShowAddUserModal(true);
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

  // Nueva interfaz para la asignación
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDeepTasks, setSelectedDeepTasks] = useState<boolean>(false);
  const [assignmentPriority, setAssignmentPriority] = useState<string>('medium');
  const [submitting, setSubmitting] = useState<boolean>(false);

  return (
    <>
    <div className="space-y-8">
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
                  setSelectedRoom(sala?.id || '');
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
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {sala.tareas.length > 0 ? (
                  <div className="space-y-3">
                    {sala.tareas.map((tarea) => (
                      <div 
                        key={tarea.id}
                        className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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
    </div>

      {/* Modal para detalles del turno */}
      {showShiftDetailsModal && selectedShiftDetails && (
        <Dialog 
          open={showShiftDetailsModal} 
          onClose={() => setShowShiftDetailsModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-bold text-gray-800">
                  {selectedShiftDetails.nombre} ({selectedShiftDetails.horario})
                </Dialog.Title>
                <button
                  onClick={() => setShowShiftDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Personal Asignado</h3>
                  {selectedShiftDetails.usuarios && selectedShiftDetails.usuarios.length > 0 ? (
                    <div className="space-y-2">
                      {selectedShiftDetails.usuarios.map(usuario => (
                        <div key={usuario.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                            {usuario.avatar_url ? (
                              <img src={usuario.avatar_url} alt={usuario.first_name} className="h-10 w-10 rounded-full" />
                            ) : (
                              <span className="font-medium text-sm">
                                {usuario.first_name.charAt(0)}{usuario.last_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{usuario.first_name} {usuario.last_name}</p>
                            <p className="text-sm text-gray-500">ID: {usuario.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay personal asignado a este turno</p>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAddTask}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Añadir Usuario a este Turno
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal para añadir usuario a turno */}
      {showAddUserModal && (
        <Dialog 
          open={showAddUserModal} 
          onClose={() => setShowAddUserModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-bold text-gray-800">
                  {selectedTurno ? `Añadir Usuario a ${selectedTurno.nombre}` : 'Configurar Horarios de Turnos'}
                </Dialog.Title>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {selectedTurno ? (
                // Formulario para añadir usuario a turno
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seleccionar Usuario
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedShiftUser}
                      onChange={(e) => setSelectedShiftUser(e.target.value)}
                    >
                      <option value="">Seleccionar un usuario</option>
                      {usuarios.map(usuario => (
                        <option key={usuario} value={usuario}>{usuario}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={addUserToShift}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!selectedShiftUser}
                    >
                      Añadir Usuario
                    </button>
                  </div>
                </div>
              ) : (
                // Formulario para configurar horarios
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Turno A (Mañana)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de inicio
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.morning.start}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            morning: { ...tempShiftHours.morning, start: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de fin
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.morning.end}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            morning: { ...tempShiftHours.morning, end: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Turno B (Tarde)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de inicio
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.afternoon.start}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            afternoon: { ...tempShiftHours.afternoon, start: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de fin
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.afternoon.end}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            afternoon: { ...tempShiftHours.afternoon, end: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Turno C (Noche)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de inicio
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.night.start}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            night: { ...tempShiftHours.night, start: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Hora de fin
                        </label>
                        <input 
                          type="time" 
                          value={tempShiftHours.night.end}
                          onChange={(e) => setTempShiftHours({
                            ...tempShiftHours,
                            night: { ...tempShiftHours.night, end: e.target.value }
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleShiftHoursUpdate}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal para detalles de tarea */}
      {showTaskDetailsModal && selectedTask && (
        <Dialog 
          open={showTaskDetailsModal} 
          onClose={() => setShowTaskDetailsModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl font-bold text-gray-800">
                  Detalles de la Tarea
                </Dialog.Title>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{selectedTask.title}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedTask.priority === 'high' ? 'Prioridad Alta' :
                     selectedTask.priority === 'medium' ? 'Prioridad Media' : 'Prioridad Baja'}
                  </span>
                </div>
                
                <div>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="font-medium">{selectedTask.status === 'pending' ? 'Pendiente' : 
                                                 selectedTask.status === 'in_progress' ? 'En Progreso' : 
                                                 selectedTask.status === 'completed' ? 'Completada' : selectedTask.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Creación</p>
                      <p className="font-medium">{selectedTask.created_at}</p>
                    </div>
                  </div>
                  {selectedTask.assignee && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Asignado a</p>
                      <p className="font-medium">{selectedTask.assignee.first_name} {selectedTask.assignee.last_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}