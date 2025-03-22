'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaClock, FaRegCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import InventoryModal from '@/app/shared/inventory/components/InventoryModal';
import CleaningManagerModal from './components/CleaningManagerModal';
import { motion } from 'framer-motion';
import { DashboardNotificationProvider } from './DashboardNotifications';
import DemoNotifications from './DemoNotifications';
import { taskService } from '@/app/services/taskService';

interface User {
  first_name: string
  last_name: string
}

interface WorkShiftSala {
  nombre: string
}

interface WorkShift {
  id: string
  organization_id: string
  sala_id: string | null
  user_id: string | null
  replacement_user_id: string | null
  start_time: string
  end_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  break_time: number | null
  overtime_minutes: number | null
  shift_type: 'morning' | 'afternoon' | 'night' | 'custom' | null
  notes: string | null
  main_user: User | null
  replacement_user: User | null
  sala: WorkShiftSala | null
}

interface Shift {
  id: string
  name: string
  schedule: string
  total_capacity: number
  active_count: number
  color: string
  area_name: string
  replacement: string | null
  duration: string
  overtime: string | null
  shift_type: 'morning' | 'afternoon' | 'night' | 'custom' | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  sala_id?: string | null
}

interface Sala {
  id: string
  name: string
  nombre?: string
  color: string
  staff_count: number
  estado?: boolean
  descripcion?: string | null
  created_at?: string
  organization_id?: string
}

interface TaskData {
  id: string
  organization_id: string
  sala_id: string | null
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  due_date: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  parent_task_id: string | null
  estimated_hours: number | null
  actual_hours: number | null
  complexity: 'low' | 'medium' | 'high' | null
  attachments: any[] | null
  completion_notes: string | null
  assignee: User | null
}

interface FormattedTask extends Omit<TaskData, 'assignee'> {
  assignee: User | null;
  assigned_name: string;
  area_id: string | null;
}

interface SalaWithTasks extends Sala {
  tasks: FormattedTask[];
  areas: {
    id: string;
    name: string;
    sala_id: string;
  }[];
}

interface Employee {
  id: string
  organization_id: string
  user_id: string
  work_shift_id: string | null
  first_name: string
  last_name: string
  position: string
  department: string
  status: string
  hire_date: string
  role: string
  contact_info: any
  created_at: string | null
  updated_at: string | null
}

interface InventoryItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  min_stock: number
  status: string
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

interface FormattedEmployee extends Employee {
  name: string
  area_name: string
}

interface Staff extends Employee {
  area_name: string | null
}

// Interfaz para las jefas de limpieza
interface CleaningManager {
  name: string;
  shift: 'morning' | 'afternoon' | 'night';
  staff?: number;
  areas?: number;
  tasks?: number;
}

// Definir un tipo para los manager de limpieza
type CleaningManagerInfo = {
  name: string;
  staff: number;
  areas: number;
  tasks: number;
  shift: 'morning' | 'afternoon' | 'night';
};

type CleaningManagersShifts = {
  morning: CleaningManagerInfo;
  afternoon: CleaningManagerInfo;
  night: CleaningManagerInfo;
};

// Modificar el tipo CleaningManagersOrgs para que acepte cualquier string como clave
type CleaningManagersOrgs = {
  [key: string]: CleaningManagersShifts;
};

// Componente wrapper para proveer notificaciones
export default function EnterpriseDashboardWrapper() {
  return (
    <DashboardNotificationProvider>
      <EnterpriseDashboard />
    </DashboardNotificationProvider>
  );
}

function EnterpriseDashboard() {
  const router = useRouter();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [areas, setAreas] = useState<Sala[]>([]);
  const [areasTasks, setAreasTasks] = useState<SalaWithTasks[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState<'edit' | 'use' | 'restock'>('use');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [organizationName, setOrganizationName] = useState<string>('Enterprise Dashboard');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [orgConfig, setOrgConfig] = useState<any>(null);
  const [showCleaningManagerModal, setShowCleaningManagerModal] = useState(false);
  const [selectedCleaningManager, setSelectedCleaningManager] = useState<CleaningManagerInfo | null>(null);

  const supabase = createClientComponentClient();

  const pulseVariants = {
    pulse: {
      scale: [1, 1.15, 1],
      opacity: [0.7, 1, 0.7],
      boxShadow: [
        '0 0 0 0 rgba(239, 68, 68, 0.7)',
        '0 0 0 10px rgba(239, 68, 68, 0)',
        '0 0 0 0 rgba(239, 68, 68, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop' as const
      }
    }
  };

  // Función para obtener configuraciones específicas según la organización
  const getOrganizationConfig = (orgId: string) => {
    // Mapa de configuraciones por ID de organización
    const configs: Record<string, any> = {
      'org-id-1': {
        title: organizationName,
        primaryColor: 'blue',
        secondaryColor: 'green',
        accentColor: 'purple'
      },
      'org-id-2': {
        title: organizationName,
        primaryColor: 'green',
        secondaryColor: 'teal',
        accentColor: 'indigo'
      },
      // Puedes agregar más organizaciones según sea necesario
    };
    
    // Devolver la configuración para el ID proporcionado o una configuración por defecto
    return configs[orgId] || { 
      title: organizationName,
      primaryColor: 'blue', 
      secondaryColor: 'indigo', 
      accentColor: 'purple' 
    };
  };

  const getSalaColor = (salaName: string): string => {
    // Colores específicos para el Instituto de Salud Mental Matías Hernández
    if (organizationName.includes('Instituto de Salud Mental Matías Hernández')) {
      const mentalHealthColors: { [key: string]: string } = {
        'MEDICINA DE VARONES': '#4F46E5',      // Índigo intenso
        'MEDICINA DE MUJERES': '#EC4899',      // Rosa intenso
        'SALA DE PARTOS': '#F59E0B',           // Ámbar brillante
        'SALÓN DE OPERACIONES': '#059669',     // Verde esmeralda
        'SALA DE EMERGENCIAS': '#EF4444',      // Rojo brillante
        'NUTRICION Y DIETETICA': '#06B6D4',    // Cyan brillante
        'RADIOLOGIA / USG': '#F97316',         // Naranja vibrante
        'PSIQUIATRÍA': '#8B5CF6',              // Púrpura vibrante
        'PATOLOGÍA': '#8B5CF6',                // Púrpura vibrante
        'AREAS ADMINISTRATIVAS': '#059669',    // Verde esmeralda
        'CLÍNICA DE HERIDAS': '#F97316',       // Naranja vibrante
        'FARMACIA': '#10B981',                 // Verde esmeralda claro
      };
      return mentalHealthColors[salaName] || '#4F46E5'; // Color por defecto
    }
    
    // Colores originales para otras organizaciones (Hospital San Miguel Arcángel)
    const colors: { [key: string]: string } = {
      'MEDICINA DE VARONES': '#4F46E5',      // Índigo intenso
      'MEDICINA DE MUJERES': '#EC4899',      // Rosa intenso
      'SALA DE PARTOS': '#F59E0B',           // Ámbar brillante
      'SALÓN DE OPERACIONES': '#059669',     // Verde esmeralda
      'SALA DE EMERGENCIAS': '#EF4444',      // Rojo brillante
      'NUTRICION Y DIETETICA': '#06B6D4',    // Cyan brillante
      'RADIOLOGIA / USG': '#F97316',         // Naranja vibrante
      'OBSTETRICIA A': '#10B981',            // Verde esmeralda claro
      'PEDIATRÍA': '#6366F1',                // Índigo claro
      'PSIQUIATRÍA': '#8B5CF6',              // Púrpura vibrante
      'UCI': '#F43F5E',                      // Rosa rojizo
      'PATOLOGÍA': '#8B5CF6',                // Púrpura vibrante
      'AREAS ADMINISTRATIVAS': '#059669',    // Verde esmeralda
      'CLÍNICA DE HERIDAS': '#F97316',       // Naranja vibrante
      'NEONATOLOGÍA': '#4F46E5',             // Índigo intenso
      'FARMACIA': '#10B981',                 // Verde esmeralda claro
      'CENTRAL DE EQUIPOS': '#F59E0B',       // Ámbar brillante
      'OBSTETRICIA B': '#EC4899'             // Rosa intenso
    };
    return colors[salaName] || '#4F46E5'; // Color por defecto
  };

  const getActiveShift = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 6 && hour < 14) {
      return 'morning';
    } else if (hour >= 14 && hour < 22) {
      return 'afternoon';
    } else {
      return 'night';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const activeShift = getActiveShift();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Pesos de distribución por sala según la organización
  const getSalaWeights = (): { [key: string]: number } => {
    // Pesos específicos para el Instituto de Salud Mental Matías Hernández
    if (organizationName.includes('Instituto de Salud Mental Matías Hernández')) {
      return {
        'MEDICINA DE VARONES': 0.20,        // Mayor peso para salas principales
        'MEDICINA DE MUJERES': 0.05,
        'SALA DE PARTOS': 0.05,
        'SALÓN DE OPERACIONES': 0.05,
        'SALA DE EMERGENCIAS': 0.05,
        'NUTRICION Y DIETETICA': 0.05,
        'RADIOLOGIA / USG': 0.05,
        'PSIQUIATRÍA': 0.20,                // Mayor peso para psiquiatría en instituto mental
        'PATOLOGÍA': 0.10,
        'AREAS ADMINISTRATIVAS': 0.05,
        'CLÍNICA DE HERIDAS': 0.05,
        'FARMACIA': 0.10
      };
    }
    
    // Pesos originales para otras organizaciones (Hospital San Miguel Arcángel)
    return {
      'MEDICINA DE VARONES': 0.17,
      'MEDICINA DE MUJERES': 0.05,
      'SALA DE PARTOS': 0.05,
      'SALÓN DE OPERACIONES': 0.05,
      'SALA DE EMERGENCIAS': 0.05,
      'NUTRICION Y DIETETICA': 0.02,
      'RADIOLOGIA / USG': 0.08,
      'OBSTETRICIA A': 0.05,
      'PEDIATRÍA': 0.10,
      'PSIQUIATRÍA': 0.05, 
      'UCI': 0.10,
      'PATOLOGÍA': 0.04,
      'AREAS ADMINISTRATIVAS': 0.05,
      'CLÍNICA DE HERIDAS': 0.04,
      'NEONATOLOGÍA': 0.05,
      'FARMACIA': 0.05,
      'CENTRAL DE EQUIPOS': 0.02,
      'OBSTETRICIA B': 0.05
    };
  };

  // Obtener los pesos según la organización actual
  const salaWeights = getSalaWeights();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Usuario no encontrado');
      if (!userProfile.organization_id) throw new Error('Usuario no tiene organización asignada');

      // Guardar el ID de la organización
      setOrganizationId(userProfile.organization_id);
      
      // Establecer la configuración de la organización
      setOrgConfig(getOrganizationConfig(userProfile.organization_id));

      // Obtener el nombre de la organización
      const { data: organizationData, error: organizationError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', userProfile.organization_id)
        .single();

      if (organizationError) {
        console.error('Error al cargar la organización:', organizationError);
      } else if (organizationData) {
        setOrganizationName(organizationData.name);
      }

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      if (inventoryError) {
        console.error('Error al cargar inventario:', inventoryError);
        throw new Error('Error al cargar datos del inventario');
      }

      setInventory(inventoryData || []);
      console.log('Datos de inventario cargados:', inventoryData);

      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('User profile:', userProfileData);
      console.log('Profile error:', profileError);

      if (profileError || !userProfileData) {
        console.error('Error al obtener perfil:', profileError);
        throw new Error('Perfil no encontrado');
      }

      // Cargar salas
      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select('*')
        .eq('organization_id', userProfileData.organization_id);

      if (salasError) {
        console.error('Error al cargar salas:', salasError);
        throw new Error(`Error al cargar salas: ${salasError.message}`);
      }

      // Cargar áreas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('organization_id', userProfileData.organization_id)
        .eq('status', 'active');

      if (areasError) {
        console.error('Error al cargar áreas:', areasError);
        throw new Error(`Error al cargar áreas: ${areasError.message}`);
      }

      // Usar el servicio compartido para cargar tareas
      const tasks = await taskService.loadAllTasks();

      if (!salasData || salasData.length === 0) {
        console.warn('No se encontraron salas');
        setAreas([]);
        setAreasTasks([]);
      } else {
        const formattedSalas = salasData.map(sala => {
          const salaAreas = areasData?.filter(area => area.sala_id === sala.id) || [];
          const salaTasks = tasks.filter(task => 
            salaAreas.some(area => area.id === task.area_id)
          ).map(task => ({
            ...task,
            assigned_name: task.users ? `${task.users.first_name} ${task.users.last_name}` : 'Sin asignar',
            area_id: task.area_id
          }));

          return {
            id: sala.id,
            name: sala.nombre,
            color: getSalaColor(sala.nombre),
            staff_count: 0,
            areas: salaAreas,
            tasks: salaTasks
          };
        });

        setAreas(formattedSalas);
        setAreasTasks(formattedSalas);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(member => member.status === 'active').length;
    const totalAreas = areas.length;

    return { totalStaff, activeStaff, totalAreas };
  }, [staff, areas]);

  const handleInventoryModalSubmit = async (formData: any) => {
    try {
      console.log('Form data submitted:', formData);
      
      // Mostrar notificaciones según la operación
      if (formData.operation === 'use' && selectedInventoryItem) {
        // showInventoryUsed(
        //   selectedInventoryItem.name,
        //   formData.operationQuantity,
        //   selectedInventoryItem.unit || 'unidades'
        // );
      } else if (formData.operation === 'restock' && selectedInventoryItem) {
        // showInventoryRestocked(
        //   selectedInventoryItem.name,
        //   formData.operationQuantity,
        //   selectedInventoryItem.unit || 'unidades'
        // );
      }
      
      setShowInventoryModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error al procesar la operación:', error);
      toast.error('Error al procesar la operación');
    }
  };

  // Definir la cantidad de personal por turno según la organización
  const getStaffCountsByOrganization = () => {
    // Verificar si es el Instituto de Salud Mental Matías Hernández - verifica por nombre
    if (organizationName.includes('Instituto de Salud Mental Matías Hernández')) {
      console.log('Usando cantidades de personal para Instituto de Salud Mental');
      return {
        morning: 25,
        afternoon: 11,
        night: 6
      };
    }
    // Valores por defecto (Hospital San Miguel Arcángel)
    return {
      morning: 41,
      afternoon: 18,
      night: 16
    };
  };

  // Obtener los conteos según la organización actual
  const staffCounts = getStaffCountsByOrganization();
  const morningStaffCount = staffCounts.morning;
  const afternoonStaffCount = staffCounts.afternoon;
  const nightStaffCount = staffCounts.night;

  // Obtener la cantidad de personal según el turno activo
  const getActiveStaffCount = () => {
    switch (activeShift) {
      case 'morning':
        return morningStaffCount;
      case 'afternoon':
        return afternoonStaffCount;
      case 'night':
        return nightStaffCount;
      default:
        return 0;
    }
  };

  // Función separada para distribuir personal a áreas
  const distributeStaffToAreas = (
    areaList: Sala[], 
    activeCount: number, 
    weights: { [key: string]: number }
  ): Sala[] => {
    let remainingStaff = activeCount;
    
    const distributedAreas = areaList.map(area => {
      const salaName = area.name || '';
      const weight = weights[salaName] || (1 / areaList.length); // Peso por defecto si no está definido
      
      // Calcular el número de personal para esta sala
      let staffCount = Math.floor(activeCount * weight);
      
      // Ajustar el conteo para asegurar que sumamos exactamente al total
      if (remainingStaff < staffCount) {
        staffCount = remainingStaff;
      }
      
      remainingStaff -= staffCount;
      
      return {
        ...area,
        staff_count: staffCount
      };
    });
    
    // Si queda personal sin asignar, asignarlo a la primera sala
    if (remainingStaff > 0 && distributedAreas.length > 0) {
      distributedAreas[0].staff_count += remainingStaff;
    }
    
    return distributedAreas;
  };

  // Función para distribuir el personal por sala según el turno activo
  const distributeStaffBySala = (): Sala[] => {
    const activeCount = getActiveStaffCount();
    const totalSalas = areas.length;
    
    // Si no hay salas o personal, no hacer nada
    if (totalSalas === 0 || activeCount === 0) {
      // Crear áreas médicas por defecto si no hay datos
      const defaultAreas: Sala[] = Object.keys(salaWeights).map((name, index) => ({
        id: `default-area-${index}`,
        name,
        color: getSalaColor(name),
        staff_count: 0,
        // Añadir propiedades requeridas para Sala
        organization_id: ''
      }));
      
      return distributeStaffToAreas(defaultAreas, activeCount, salaWeights);
    }
    
    return distributeStaffToAreas(areas, activeCount, salaWeights);
  };
  
  // Distribuir el personal según el turno activo
  const distributedAreas = distributeStaffBySala();
  
  // Calcular el total de personal distribuido para los porcentajes
  const totalDistributedStaff = distributedAreas.reduce((total: number, area: Sala) => total + area.staff_count, 0);

  // Función para obtener los gerentes de limpieza según la organización
  const getCleaningManagers = (): CleaningManagersOrgs => {
    return {
      'instituto-matias-hernandez': {
        morning: {
          name: 'Ana María Rodríguez',
          staff: 7,
          areas: 10,
          tasks: 22,
          shift: 'morning'
        },
        afternoon: {
          name: 'Luis Carlos Vega',
          staff: 8,
          areas: 12,
          tasks: 24,
          shift: 'afternoon'
        },
        night: {
          name: 'María Elena Torres',
          staff: 5,
          areas: 8,
          tasks: 18,
          shift: 'night'
        }
      },
      'hospital-san-miguel': {
        morning: {
          name: 'Carmen Judith Pérez',
          staff: 9,
          areas: 14,
          tasks: 28,
          shift: 'morning'
        },
        afternoon: {
          name: 'José Antonio Ramos',
          staff: 8,
          areas: 12,
          tasks: 25,
          shift: 'afternoon'
        },
        night: {
          name: 'Gabriela Sofía Mendoza',
          staff: 6,
          areas: 10,
          tasks: 20,
          shift: 'night'
        }
      }
    };
  };

  // Mapeo de IDs de organización a claves en el objeto de gerentes
  const getOrgMappingKey = (orgId: string): string => {
    // Este mapeo debe ser actualizado con los IDs reales de la base de datos
    const orgMapping: Record<string, string> = {
      // Suponiendo que estos son los IDs reales
      '123456': 'instituto-matias-hernandez',
      '789012': 'hospital-san-miguel'
      // Añadir más mapeos según sea necesario
    };
    
    // Si el ID está en el mapeo, usar esa clave, de lo contrario verificar si contiene palabras clave
    if (orgMapping[orgId]) {
      return orgMapping[orgId];
    }
    
    // Intentar determinar la organización basado en el nombre
    if (organizationName.toLowerCase().includes('instituto') || 
        organizationName.toLowerCase().includes('matías') || 
        organizationName.toLowerCase().includes('hernandez')) {
      return 'instituto-matias-hernandez';
    }
    
    // Por defecto, usar Hospital San Miguel
    return 'hospital-san-miguel';
  };

  // Función para obtener el gerente de limpieza del turno actual
  const getCurrentShiftManager = (): CleaningManagerInfo => {
    const managers = getCleaningManagers();
    const mappedOrgKey = getOrgMappingKey(organizationId);
    const shiftKey = activeShift as keyof CleaningManagersShifts;
    
    return managers[mappedOrgKey][shiftKey];
  };

  // Determinar si el turno está a punto de cambiar (dentro de los próximos 30 minutos)
  const isShiftChangingSoon = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    
    // Turno de mañana termina a las 14:00
    if (hour === 13 && minutes >= 30 && activeShift === 'morning') {
      return true;
    }
    
    // Turno de tarde termina a las 22:00
    if (hour === 21 && minutes >= 30 && activeShift === 'afternoon') {
      return true;
    }
    
    // Turno de noche termina a las 6:00
    if (hour === 5 && minutes >= 30 && activeShift === 'night') {
      return true;
    }
    
    return false;
  };

  // Definir variantes de animación para tarjetas de turnos
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }
    }),
    hover: {
      scale: 1.03,
      boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.98 }
  };

  // Añadir variantes para el contenedor de áreas
  const areaContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const areaItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    },
    hover: {
      scale: 1.02,
      backgroundColor: "rgba(243, 244, 246, 0.7)",
      boxShadow: "0px 3px 8px rgba(0,0,0,0.05)",
      transition: { duration: 0.2 }
    }
  };

  // Añadir variantes de animación para las tarjetas de salas
  const salaCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * custom,
        type: "spring",
        stiffness: 70,
        damping: 15
      }
    }),
    hover: {
      y: -5,
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 }
    }
  };

  const taskVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.05 * custom,
        duration: 0.3
      }
    }),
    hover: {
      scale: 1.02,
      backgroundColor: "rgba(249, 250, 251, 0.8)",
      transition: { duration: 0.2 }
    },
    completed: {
      backgroundColor: "rgba(209, 250, 229, 0.4)",
      transition: { duration: 0.5 }
    }
  };

  // Definir variantes para los items de inventario
  const inventoryItemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.3
      }
    },
    low: {
      boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.3)",
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    restocked: {
      backgroundColor: ["rgba(209, 250, 229, 0)", "rgba(209, 250, 229, 1)", "rgba(209, 250, 229, 0)"],
      transition: {
        duration: 2
      }
    },
    used: {
      backgroundColor: ["rgba(254, 226, 226, 0)", "rgba(254, 226, 226, 1)", "rgba(254, 226, 226, 0)"],
      transition: {
        duration: 2
      }
    }
  };

  // Detectar cambios de turno
  useEffect(() => {
    const checkShiftChange = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      let currentShift: 'morning' | 'afternoon' | 'night';
      if (currentHour >= 6 && currentHour < 14) {
        currentShift = 'morning';
      } else if (currentHour >= 14 && currentHour < 22) {
        currentShift = 'afternoon';
      } else {
        currentShift = 'night';
      }
      
      // Verificar si hubo un cambio de turno
      if (typeof window !== 'undefined') {
        const lastShift = localStorage.getItem('lastShift');
        if (lastShift && lastShift !== currentShift) {
          // showShiftChanged(currentShift);
        }
        localStorage.setItem('lastShift', currentShift);
      }
    };
    
    // Verificar al cargar
    checkShiftChange();
    
    // Verificar cada minuto
    const interval = setInterval(checkShiftChange, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold text-${orgConfig?.primaryColor || 'blue'}-800 mb-2`}>
          {organizationName}
        </h1>
        <div className={`h-1 w-32 bg-${orgConfig?.primaryColor || 'blue'}-500 rounded`}></div>
        
        {/* Elementos específicos según la organización */}
        {orgConfig && organizationId === 'org-id-1' && (
          <div className="mt-2 text-sm text-gray-600">
            {organizationName} - Centro de excelencia en salud
          </div>
        )}
        
        {orgConfig && organizationId === 'org-id-2' && (
          <div className="mt-2 text-sm text-gray-600">
            {organizationName} - Especialistas en salud mental
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-6">
        {/* Eliminando los botones innecesarios */}
      </div>

      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
        <motion.div 
          onClick={() => {
            const currentManager = getCurrentShiftManager();
            setSelectedCleaningManager(currentManager);
            setShowCleaningManagerModal(true);
          }}
          className={`relative flex items-center gap-3 shadow-md rounded-lg p-2.5 pr-3.5 cursor-pointer ${
            activeShift === 'morning' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' : 
            activeShift === 'afternoon' ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200' : 
            'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
          }`}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)" 
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
            activeShift === 'morning' ? 'bg-blue-200 text-blue-700' : 
            activeShift === 'afternoon' ? 'bg-green-200 text-green-700' : 
            'bg-purple-200 text-purple-700'
          }`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-4 h-4"
            >
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
            </svg>

            {/* Mini-badge de turno */}
            <div className={`absolute -bottom-1 -right-1 rounded-full w-3.5 h-3.5 flex items-center justify-center ${
              activeShift === 'morning' ? 'bg-blue-700' : 
              activeShift === 'afternoon' ? 'bg-green-700' : 
              'bg-purple-700'
            } border border-white`}>
              <span className="text-white text-[7px] font-bold">
                {activeShift === 'morning' ? 'M' : activeShift === 'afternoon' ? 'T' : 'N'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className={`text-xs font-medium ${
                activeShift === 'morning' ? 'text-blue-700' : 
                activeShift === 'afternoon' ? 'text-green-700' : 
                'text-purple-700'
              }`}>
                Commander
              </p>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                activeShift === 'morning' ? 'bg-blue-100 text-blue-700' : 
                activeShift === 'afternoon' ? 'bg-green-100 text-green-700' : 
                'bg-purple-100 text-purple-700'
              }`}>
                {activeShift === 'morning' ? 'Mañana' : activeShift === 'afternoon' ? 'Tarde' : 'Noche'}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{getCurrentShiftManager().name}</p>
          </div>
          
          {isShiftChangingSoon() && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"
              variants={pulseVariants}
              animate="pulse"
            />
          )}
        </motion.div>
      </div>

      {/* Agregar cards de turnos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'morning' ? 'ring-2 ring-blue-500' : ''}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              custom={0}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Mañana</h3>
                <p className="text-sm text-gray-500">6:00 - 14:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {activeShift === 'morning' ? morningStaffCount : shifts.filter(s => s.shift_type === 'morning' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'morning' && (
                  <motion.span 
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    Activo ahora
                  </motion.span>
                )}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {activeShift === 'morning' ? `${morningStaffCount}/${morningStaffCount}` : `0/${morningStaffCount}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="h-2 rounded-full bg-blue-500" 
                    style={{ width: activeShift === 'morning' ? '100%' : '0%' }}
                    initial={{ width: '0%' }}
                    animate={{ width: activeShift === 'morning' ? '100%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'afternoon' ? 'ring-2 ring-green-500' : ''}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              custom={1}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tarde</h3>
                <p className="text-sm text-gray-500">14:00 - 22:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {activeShift === 'afternoon' ? afternoonStaffCount : shifts.filter(s => s.shift_type === 'afternoon' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'afternoon' && (
                  <motion.span 
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    Activo ahora
                  </motion.span>
                )}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {activeShift === 'afternoon' ? `${afternoonStaffCount}/${afternoonStaffCount}` : `0/${afternoonStaffCount}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="h-2 rounded-full bg-green-500" 
                    style={{ width: activeShift === 'afternoon' ? '100%' : '0%' }}
                    initial={{ width: '0%' }}
                    animate={{ width: activeShift === 'afternoon' ? '100%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'night' ? 'ring-2 ring-purple-500' : ''}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              custom={2}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Noche</h3>
                <p className="text-sm text-gray-500">22:00 - 6:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {activeShift === 'night' ? nightStaffCount : shifts.filter(s => s.shift_type === 'night' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'night' && (
                  <motion.span 
                    className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.9, 1, 0.9]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    Activo ahora
                  </motion.span>
                )}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {activeShift === 'night' ? `${nightStaffCount}/${nightStaffCount}` : `0/${nightStaffCount}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="h-2 rounded-full bg-purple-500" 
                    style={{ width: activeShift === 'night' ? '100%' : '0%' }}
                    initial={{ width: '0%' }}
                    animate={{ width: activeShift === 'night' ? '100%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Sección de Distribución por Salas (movida debajo de los turnos) */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <motion.h3 
                className="text-xl font-semibold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {organizationName.includes('Instituto de Salud Mental Matías Hernández') 
                  ? 'Distribución por Áreas Psiquiátricas' 
                  : 'Distribución por Salas'}
              </motion.h3>
              <div className="flex gap-2">
                <motion.button 
                  className="p-2 rounded hover:bg-gray-100"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(243, 244, 246, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-2V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </motion.button>
                <motion.button 
                  className="p-2 rounded hover:bg-gray-100"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(243, 244, 246, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="h-64 bg-gray-50 rounded-lg p-4 overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributedAreas.map(area => ({
                        name: area.name,
                        value: area.staff_count,
                        color: getSalaColor(area.name || '')
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                      animationBegin={300}
                    >
                      {distributedAreas.map((area, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getSalaColor(area.name || '')} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      itemStyle={{ color: '#374151' }}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div 
                className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar"
                variants={areaContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {distributedAreas.map((area, index) => {
                  const areaColor = getSalaColor(area.name || '');
                  const percentage = totalDistributedStaff > 0 
                    ? Math.round((area.staff_count / totalDistributedStaff) * 100) 
                    : 0;
                  
                  return (
                    <motion.div 
                      key={area.id} 
                      className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                      variants={areaItemVariants}
                      whileHover="hover"
                      custom={index}
                    >
                      <div className="flex items-center gap-2">
                        <motion.div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: areaColor }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + (index * 0.05), duration: 0.3 }}
                        />
                        <span className="text-gray-700">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{area.staff_count} personal</span>
                        <motion.span 
                          className="text-sm font-medium px-2 py-0.5 rounded" 
                          style={{ 
                            backgroundColor: `${areaColor}15`,
                            color: areaColor 
                          }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + (index * 0.05), duration: 0.3 }}
                        >
                          {percentage}%
                        </motion.span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Sección de Inventario (Versión móvil) */}
        <div className="lg:hidden">
          <motion.div
            className="bg-white rounded-xl shadow-lg p-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
              <motion.button 
                onClick={() => router.push('/shared/inventory')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver Todo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
            {/* Inventario en versión móvil - mostrar solo 2 items */}
            <div className="space-y-3">
              {inventory.slice(0, 2).map((item, index) => {
                const stockPercentage = (item.quantity / item.min_stock) * 100;
                const isLowStock = stockPercentage <= 50;
                return (
                  <motion.div 
                    key={item.id}
                    className="p-3 border border-gray-100 rounded-lg"
                    variants={inventoryItemVariants}
                    initial="hidden"
                    animate={isLowStock ? ["visible", "low"] : "visible"}
                    whileHover="hover"
                    custom={index}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="h-2 w-24 bg-gray-100 rounded-full mt-1">
                          <motion.div 
                            className={`h-2 rounded-full ${
                              stockPercentage > 100 ? 'bg-green-500' :
                              stockPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stockPercentage > 100 ? 'bg-green-100 text-green-800' :
                        stockPercentage > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {inventory.length > 2 && (
                <motion.div
                  className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ver más items...
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Inventario para pantallas grandes */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <motion.h2 
                className="text-2xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >Inventario</motion.h2>
              <motion.button 
                onClick={() => router.push('/shared/inventory')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver Todo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
            <motion.div 
              className="bg-white rounded-xl shadow-lg p-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {inventory.length === 0 ? (
                  <motion.div 
                    className="flex flex-col items-center justify-center min-h-[300px] text-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <motion.svg 
                      className="w-12 h-12 text-gray-400 mb-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotateZ: 360 }}
                      transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </motion.svg>
                    <motion.h3 
                      className="text-lg font-medium text-gray-900 mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >No hay items en el inventario</motion.h3>
                    <motion.p 
                      className="text-sm text-gray-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >Comienza agregando algunos items al inventario.</motion.p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-4 pr-2"
                    variants={areaContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {inventory.map((item, index) => {
                      const stockPercentage = (item.quantity / item.min_stock) * 100;
                      const isLowStock = stockPercentage <= 50;
                      
                      // Determinar la animación inicial basada en el stock
                      let initialAnimation = isLowStock ? ["visible", "low"] : "visible";
                      
                      return (
                        <motion.div 
                          key={item.id}
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setShowInventoryModal(true);
                          }}
                          className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-all"
                          variants={inventoryItemVariants}
                          initial="hidden"
                          animate={initialAnimation}
                          whileHover="hover"
                          custom={index}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <motion.h4 
                                className="font-medium text-gray-900"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + (0.05 * index) }}
                              >{item.name}</motion.h4>
                              <motion.p 
                                className="text-sm text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + (0.05 * index) }}
                              >{item.description || 'Sin descripción'}</motion.p>
                            </div>
                            <motion.span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stockPercentage > 100 
                                ? 'bg-green-100 text-green-800'
                                : stockPercentage > 50
                                ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 * index + 0.4 * index }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {item.quantity} {item.unit}
                            </motion.span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Stock mínimo: {item.min_stock}</span>
                              <motion.span 
                                animate={
                                  stockPercentage <= 30 
                                    ? { color: ["#EF4444", "#F87171", "#EF4444"] } 
                                    : {}
                                }
                                transition={{ duration: 1.5, repeat: stockPercentage <= 30 ? Infinity : 0 }}
                              >{Math.round(stockPercentage)}%</motion.span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full transition-all ${
                                  stockPercentage > 100 
                                    ? 'bg-green-500'
                                    : stockPercentage > 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                transition={{ 
                                  duration: 1, 
                                  delay: 0.5 + (0.05 * index), 
                                  ease: "easeOut" 
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sección principal */}
      <div className="grid grid-cols-1 gap-6">
        {/* Sección de Tareas por Sala (ahora donde estaba distribución) */}
        <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
                Tareas por Sala
              </h2>
            </motion.div>
            
            <motion.button 
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Ver Todas</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {areasTasks.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-12 text-center col-span-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
              >
                <motion.div 
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 5, 0] }}
                  transition={{ duration: 1, delay: 0.4, type: "spring", bounce: 0.4 }}
                >
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-gray-700 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  No hay tareas asignadas
                </motion.h3>
                <motion.p 
                  className="text-gray-500 max-w-md mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Las tareas por sala aparecerán aquí cuando se asignen tareas a las áreas. 
                  Puedes crear nuevas tareas desde la sección de administración.
                </motion.p>
                <motion.button
                  className="mt-6 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  Crear Tarea
                </motion.button>
              </motion.div>
            ) : (
              <>
                {areasTasks.filter(sala => sala.tasks && sala.tasks.length > 0).map((sala, index) => {
                  const pendingTasks = sala.tasks.filter(task => task.status === 'pending' || task.status === 'in_progress');
                  const completedTasks = sala.tasks.filter(task => task.status === 'completed');
                  const totalTasks = sala.tasks.length;
                  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
                  const areaColor = getSalaColor(sala.name || '');
                  
                  return (
                    <motion.div 
                      key={sala.id}
                      className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                      variants={{
                        hidden: { opacity: 0, y: 50, scale: 0.9 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -5, boxShadow: "0 12px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1 * index,
                        type: "spring",
                        bounce: 0.3
                      }}
                    >
                      {/* Contenido existente de la tarjeta de sala */}
                      <div 
                        className="p-4 flex justify-between items-center"
                        style={{ 
                          background: `linear-gradient(to right, ${areaColor}15, ${areaColor}25)`,
                          borderBottom: `2px solid ${areaColor}` 
                        }}
                      >
                        {/* ... */}
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: areaColor }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <span className="text-white font-bold">
                              {sala.name?.substring(0, 2) || "SA"}
                            </span>
                          </motion.div>
                          <div>
                            <h3 className="font-bold text-gray-800">{sala.name}</h3>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <span>{totalTasks} tareas</span>
                              <span className="mx-1.5">•</span>
                              <span>{completedTasks.length} completadas</span>
                            </div>
                          </div>
                        </div>
                        
                        <motion.div 
                          className="relative h-12 w-12"
                          whileHover={{ scale: 1.15 }}
                        >
                          <svg viewBox="0 0 36 36" className="h-12 w-12">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="3"
                              strokeDasharray="100, 100"
                            />
                            <motion.path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={areaColor}
                              strokeWidth="3"
                              strokeDasharray={`${completionPercentage}, 100`}
                              initial={{ strokeDasharray: "0, 100" }}
                              animate={{ strokeDasharray: `${completionPercentage}, 100` }}
                              transition={{ duration: 1.5, delay: 0.2 * index, ease: "easeOut" }}
                            />
                            <text 
                              x="18" 
                              y="20.5" 
                              textAnchor="middle" 
                              fontSize="9"
                              fill={areaColor}
                              fontWeight="bold"
                            >
                              {completionPercentage}%
                            </text>
                          </svg>
                        </motion.div>
                      </div>
                      
                      <div className="p-4">
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {sala.tasks.slice(0, 3).map((task, taskIndex) => {
                            const isCompleted = task.status === 'completed';
                            const isHighPriority = task.priority === 'high' || task.priority === 'urgent';
                            
                            return (
                              <motion.div 
                                key={task.id}
                                className={`p-3 rounded-lg border ${
                                  isCompleted ? 'border-green-100 bg-gradient-to-r from-green-50 to-emerald-50' : 
                                  isHighPriority ? 'border-red-100 bg-gradient-to-r from-red-50 to-orange-50' :
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
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center">
                                      <motion.div 
                                        className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center border-2 ${
                                          isCompleted ? 'border-green-500 bg-green-100' : 
                                          isHighPriority ? 'border-red-500 bg-red-100' :
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
                                        {task.title}
                                      </h4>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 ml-6">
                                      <span className="flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {task.assigned_name || 'Sin asignar'}
                                      </span>
                                      {task.due_date && (
                                        <>
                                          <span className="mx-1.5">•</span>
                                          <span className="flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(task.due_date).toLocaleDateString()}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <motion.span 
                                    className={`text-xs px-2 py-1 ml-2 flex-shrink-0 rounded-full font-medium ${
                                      isCompleted ? 'bg-green-100 text-green-700' :
                                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 * taskIndex + 0.4 * index }}
                                  >
                                    {isCompleted ? 'Completado' :
                                     task.status === 'in_progress' ? 'En Progreso' :
                                     task.priority === 'urgent' ? 'Urgente' :
                                     task.priority === 'high' ? 'Alta' :
                                     'Pendiente'}
                                  </motion.span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        
                        {sala.tasks.length > 3 && (
                          <motion.div 
                            className="mt-3 p-2 text-center text-indigo-600 hover:text-indigo-800 cursor-pointer rounded-lg hover:bg-indigo-50 font-medium flex items-center justify-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>Ver {sala.tasks.length - 3} tareas más</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Mensaje cuando se filtran todas las salas por no tener tareas */}
                {areasTasks.filter(sala => sala.tasks && sala.tasks.length > 0).length === 0 && (
                  <motion.div 
                    className="flex flex-col items-center justify-center py-12 text-center col-span-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
                  >
                    <motion.div 
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 5, 0] }}
                      transition={{ duration: 1, delay: 0.4, type: "spring", bounce: 0.4 }}
                    >
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </motion.div>
                    <motion.h3 
                      className="text-xl font-bold text-gray-700 mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      No hay tareas disponibles
                    </motion.h3>
                    <motion.p 
                      className="text-gray-500 max-w-md mx-auto"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      Las salas existen pero no tienen tareas asignadas.
                      Puedes crear nuevas tareas desde la sección de administración.
                    </motion.p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showInventoryModal && selectedInventoryItem && (
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          onSubmit={handleInventoryModalSubmit}
          item={selectedInventoryItem}
          mode={inventoryModalMode}
          hidePercentage={true}
        />
      )}

      {showCleaningManagerModal && selectedCleaningManager && (
        <CleaningManagerModal
          isOpen={showCleaningManagerModal}
          onClose={() => setShowCleaningManagerModal(false)}
          managerName={selectedCleaningManager.name}
          shift={selectedCleaningManager.shift}
          staffCount={selectedCleaningManager.staff}
          areasCount={selectedCleaningManager.areas}
          tasksCount={selectedCleaningManager.tasks}
          isShiftChangingSoon={isShiftChangingSoon()}
        />
      )}

      {/* Componente de notificaciones animadas */}
      <DemoNotifications />
    </div>
  );
}