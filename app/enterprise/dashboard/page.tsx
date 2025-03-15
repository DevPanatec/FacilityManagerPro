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

export default function EnterpriseOverviewPage() {
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

  const supabase = createClientComponentClient();

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
  const getSalaWeights = () => {
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

      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select('*')
        .eq('organization_id', userProfileData.organization_id);

      console.log('Salas data:', salasData);
      console.log('Salas error:', salasError);

      if (salasError) {
        console.error('Error al cargar salas:', salasError);
        throw new Error(`Error al cargar salas: ${salasError.message}`);
      }

      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('organization_id', userProfileData.organization_id)
        .eq('status', 'active');

      if (areasError) {
        console.error('Error al cargar áreas:', areasError);
        throw new Error(`Error al cargar áreas: ${areasError.message}`);
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to(id, first_name, last_name)
        `)
        .eq('organization_id', userProfileData.organization_id)
        .not('assigned_to', 'is', null);

      if (tasksError) {
        console.error('Error al cargar tareas:', tasksError);
        throw new Error(`Error al cargar tareas: ${tasksError.message}`);
      }

      if (!salasData || salasData.length === 0) {
        console.warn('No se encontraron salas');
        setAreas([]);
        setAreasTasks([]);
      } else {
        const formattedSalas = salasData.map(sala => {
          const salaAreas = areasData?.filter(area => area.sala_id === sala.id) || [];
          const salaTasks = tasksData?.filter(task => 
            salaAreas.some(area => area.id === task.area_id)
          ).map(task => ({
            ...task,
            assigned_name: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Sin asignar',
            area_id: task.area_id
          })) || [];

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
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
          <span>Ver Todo el Personal ({staff.length})</span>
        </button>
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
          <span>Exportar Datos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'morning' ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Mañana</h3>
                <p className="text-sm text-gray-500">6:00 - 14:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {activeShift === 'morning' ? morningStaffCount : shifts.filter(s => s.shift_type === 'morning' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'morning' && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Activo ahora
                  </span>
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
                  <div 
                    className="h-2 rounded-full bg-blue-500" 
                    style={{ width: activeShift === 'morning' ? '100%' : '0%' }} 
                  />
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'afternoon' ? 'ring-2 ring-green-500' : ''}`}>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tarde</h3>
                <p className="text-sm text-gray-500">14:00 - 22:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {activeShift === 'afternoon' ? afternoonStaffCount : shifts.filter(s => s.shift_type === 'afternoon' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'afternoon' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Activo ahora
                  </span>
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
                  <div 
                    className="h-2 rounded-full bg-green-500" 
                    style={{ width: activeShift === 'afternoon' ? '100%' : '0%' }} 
                  />
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-lg p-6 ${activeShift === 'night' ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Noche</h3>
                <p className="text-sm text-gray-500">22:00 - 6:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {activeShift === 'night' ? nightStaffCount : shifts.filter(s => s.shift_type === 'night' && s.status === 'in_progress').length} activos
                </span>
                {activeShift === 'night' && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Activo ahora
                  </span>
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
                  <div 
                    className="h-2 rounded-full bg-purple-500" 
                    style={{ width: activeShift === 'night' ? '100%' : '0%' }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {organizationName.includes('Instituto de Salud Mental Matías Hernández') 
                  ? 'Distribución por Áreas Psiquiátricas' 
                  : 'Distribución por Salas'}
              </h3>
              <div className="flex gap-2">
                <button className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-2V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button className="p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-50 rounded-lg p-4">
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
                    >
                      {distributedAreas.map((area, index) => (
                        <Cell key={`cell-${index}`} fill={getSalaColor(area.name || '')} />
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {distributedAreas.map(area => {
                  const areaColor = getSalaColor(area.name || '');
                  const percentage = totalDistributedStaff > 0 
                    ? Math.round((area.staff_count / totalDistributedStaff) * 100) 
                    : 0;
                  
                  return (
                    <div key={area.id} className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: areaColor }} />
                        <span className="text-gray-700">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{area.staff_count} personal</span>
                        <span 
                          className="text-sm font-medium px-2 py-0.5 rounded" 
                          style={{ 
                            backgroundColor: `${areaColor}15`,
                            color: areaColor 
                          }}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
              <button 
                onClick={() => router.push('/shared/inventory')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
              >
                Ver Todo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {inventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay items en el inventario</h3>
                    <p className="text-sm text-gray-500">Comienza agregando algunos items al inventario.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pr-2">
                    {inventory.map(item => {
                      const stockPercentage = (item.quantity / item.min_stock) * 100;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setShowInventoryModal(true);
                          }}
                          className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.description || 'Sin descripción'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stockPercentage > 100 
                                ? 'bg-green-100 text-green-800'
                                : stockPercentage > 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Stock mínimo: {item.min_stock}</span>
                              <span>{Math.round(stockPercentage)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  stockPercentage > 100 
                                    ? 'bg-green-500'
                                    : stockPercentage > 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tareas por Sala</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {areasTasks.map(sala => {
            const completedTasks = sala.tasks.filter(t => t.status === 'completed').length;
            const progress = `${completedTasks}/${sala.tasks.length}`;
            const progressPercentage = sala.tasks.length > 0 ? (completedTasks / sala.tasks.length) * 100 : 0;
            const salaColor = getSalaColor(sala.name);

            const areasWithTasks = sala.areas.filter(area => 
              sala.tasks.some(task => task.area_id === area.id)
            );

            return (
              <div key={sala.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-l-4" style={{ borderColor: salaColor }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: salaColor }}>{sala.name}</h3>
                    <span className="text-sm text-gray-500">{sala.tasks.length} tareas</span>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {areasWithTasks.map(area => {
                      const areaTasks = sala.tasks.filter(task => task.area_id === area.id);
                      
                      return (
                        <div key={area.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-700">{area.name}</h4>
                            <span className="text-xs text-gray-500">{areaTasks.length} tareas</span>
                          </div>
                          <div className="space-y-3">
                            {areaTasks.map(task => (
                              <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {task.status === 'completed' ? 'Completado' :
                                     task.status === 'in_progress' ? 'En progreso' :
                                     'Pendiente'}
                                  </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Asignado a: {task.assigned_name}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Progreso General</span>
                    <span className="text-sm" style={{ color: salaColor }}>{progress}</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-1 rounded-full" 
                      style={{ 
                        width: `${progressPercentage}%`,
                        backgroundColor: salaColor
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showInventoryModal && selectedInventoryItem && (
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          onSubmit={handleInventoryModalSubmit}
          item={selectedInventoryItem}
          mode={inventoryModalMode}
        />
      )}
    </div>
  );
}