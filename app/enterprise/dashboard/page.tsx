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

interface User {
  first_name: string
  last_name: string
}

interface WorkShiftArea {
  name: string
}

interface WorkShift {
  id: string
  organization_id: string
  area_id: string | null
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
  area: WorkShiftArea | null
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
}

interface Area {
  id: string
  name: string
  color: string
  staff_count: number
}

interface TaskData {
  id: string
  organization_id: string
  area_id: string | null
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

interface FormattedTask extends TaskData {
  assigned_name: string
}

interface AreaWithTasks extends Area {
  tasks: FormattedTask[]
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
  area_id: string | null
  name: string
  description: string | null
  category: string | null
  quantity: number
  minimum_quantity: number
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string | null
  updated_at: string | null
  supplier_info: any
  cost_history: any[]
  location_data: any
  barcode: string | null
  reorder_point: number | null
  unit_of_measure: string | null
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasTasks, setAreasTasks] = useState<AreaWithTasks[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario y su organización
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('Error al obtener perfil:', profileError);
        throw profileError;
      }

      if (!userProfile) throw new Error('Usuario no encontrado');

      // Verificar permisos del usuario
      console.log('Perfil de usuario:', {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        organization_id: userProfile.organization_id
      });

      // Intentar una consulta simple a employees primero
      const { data: testAccess, error: testError } = await supabase
        .from('users')
        .select('count')
        .eq('organization_id', userProfile.organization_id)
        .single();

      if (testError) {
        console.log('Error de prueba de acceso:', testError);
      } else {
        console.log('Acceso exitoso a usuarios, conteo:', testAccess);
      }

      // Cargar personal desde la tabla users
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select(`
          id,
          organization_id,
          first_name,
          last_name,
          role,
          status
        `)
        .eq('organization_id', userProfile.organization_id)
        .not('role', 'eq', 'superadmin');

      if (staffError) {
        console.log('Error detallado del personal:', staffError);
        throw staffError;
      }

      const formattedStaff = (staffData || []).map(member => ({
        id: member.id,
        organization_id: member.organization_id,
        user_id: member.id,
        work_shift_id: null,
        first_name: member.first_name,
        last_name: member.last_name,
        position: member.role || 'No especificado',
        department: 'General',  // Por defecto asignamos a General
        status: member.status || 'active',
        hire_date: new Date().toISOString(),
        role: member.role,
        contact_info: {},
        created_at: null,
        updated_at: null,
        name: `${member.first_name} ${member.last_name}`,
        area_name: 'General'  // Por defecto asignamos a General
      }));

      setStaff(formattedStaff);

      // Cargar turnos
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('work_shifts')
        .select(`
          id,
          organization_id,
          area_id,
          user_id,
          replacement_user_id,
          start_time,
          end_time,
          status,
          break_time,
          overtime_minutes,
          shift_type,
          notes,
          main_user:user_id(
            first_name,
            last_name
          ),
          replacement_user:replacement_user_id(
            first_name,
            last_name
          ),
          area:area_id(
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .order('start_time');

      if (shiftsError) throw shiftsError;
      
      const formattedShifts = (shiftsData as unknown as WorkShift[])?.map(shift => ({
        ...shift,
        name: shift.shift_type ? 
          `Turno ${shift.shift_type === 'morning' ? 'Mañana' : 
                  shift.shift_type === 'afternoon' ? 'Tarde' : 
                  shift.shift_type === 'night' ? 'Noche' : 'Personalizado'}` :
          `${shift.main_user?.first_name} ${shift.main_user?.last_name}`,
        schedule: `${new Date(shift.start_time).toLocaleTimeString()} - ${new Date(shift.end_time).toLocaleTimeString()}`,
        total_capacity: shift.shift_type ? 
          (shift.shift_type === 'morning' ? 10 : 
           shift.shift_type === 'afternoon' ? 8 : 
           shift.shift_type === 'night' ? 6 : 4) : 1,
        active_count: shift.status === 'in_progress' ? 1 : 0,
        color: shift.status === 'completed' ? '#22c55e' : 
               shift.status === 'in_progress' ? '#3b82f6' : 
               shift.status === 'cancelled' ? '#ef4444' : '#f59e0b',
        area_name: shift.area?.name || 'Sin área',
        replacement: shift.replacement_user ? 
          `${shift.replacement_user.first_name} ${shift.replacement_user.last_name}` : null,
        duration: shift.break_time ? 
          `${Math.floor((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60) - shift.break_time)} min (${shift.break_time} min descanso)` :
          `${Math.floor((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60))} min`,
        overtime: shift.overtime_minutes ? `${shift.overtime_minutes} min extra` : null,
        shift_type: shift.shift_type,
        status: shift.status
      })) || [];

      setShifts(formattedShifts);

      // Cargar áreas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('name');

      if (areasError) throw areasError;
      setAreas(areasData || []);

      // Cargar tareas por área
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          organization_id,
          area_id,
          title,
          description,
          status,
          priority,
          assigned_to,
          due_date,
          created_at,
          estimated_hours,
          actual_hours,
          complexity,
          assignee:assigned_to(
            first_name,
            last_name
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (tasksError) throw tasksError;

      // Agrupar tareas por área
      const areasWithTasks = areasData?.map(area => ({
        ...area,
        tasks: (tasksData as unknown as TaskData[])?.filter(task => task.area_id === area.id).map(task => ({
          id: task.id,
          organization_id: task.organization_id,
          area_id: task.area_id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assigned_to,
          due_date: task.due_date,
          estimated_hours: task.estimated_hours,
          actual_hours: task.actual_hours,
          complexity: task.complexity,
          assignee: task.assignee,
          assigned_name: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Sin asignar'
        })) || []
      })) || [];

      setAreasTasks(areasWithTasks);

      // Cargar inventario (mostrar solo 3 items)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active')
        .order('quantity', { ascending: true })
        .limit(3);

      if (inventoryError) throw inventoryError;
      setInventory(inventoryData || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Error al cargar el dashboard');
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(member => member.status === 'active').length;
    const totalAreas = areas.length;

    return { totalStaff, activeStaff, totalAreas };
  }, [staff, areas]);

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
      <div className="flex justify-between items-center mb-6">
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
          <span>Ver Todo el Personal ({staff.length})</span>
        </button>
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
          <span>Exportar Datos</span>
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda y Central - Turnos y Áreas */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Turno Mañana */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Mañana</h3>
                <p className="text-sm text-gray-500">6:00 - 14:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {shifts.filter(s => s.shift_type === 'morning' && s.status === 'in_progress').length} activos
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {shifts.filter(s => s.shift_type === 'morning' && s.status === 'in_progress').length}/15
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500" 
                    style={{ 
                      width: `${(shifts.filter(s => s.shift_type === 'morning' && s.status === 'in_progress').length / 15) * 100}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Turno Tarde */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tarde</h3>
                <p className="text-sm text-gray-500">14:00 - 22:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {shifts.filter(s => s.shift_type === 'afternoon' && s.status === 'in_progress').length} activos
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {shifts.filter(s => s.shift_type === 'afternoon' && s.status === 'in_progress').length}/12
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500" 
                    style={{ 
                      width: `${(shifts.filter(s => s.shift_type === 'afternoon' && s.status === 'in_progress').length / 12) * 100}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Turno Noche */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Noche</h3>
                <p className="text-sm text-gray-500">22:00 - 6:00</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {shifts.filter(s => s.shift_type === 'night' && s.status === 'in_progress').length} activos
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Capacidad</span>
                  <span className="font-medium">
                    {shifts.filter(s => s.shift_type === 'night' && s.status === 'in_progress').length}/8
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-purple-500" 
                    style={{ 
                      width: `${(shifts.filter(s => s.shift_type === 'night' && s.status === 'in_progress').length / 8) * 100}%` 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Distribución por Áreas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Distribución por Áreas
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
              {/* Gráfico de Dona */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areas.map(area => ({
                        name: area.name,
                        value: staff.filter(s => s.area_name === area.name).length || 1,
                        color: getAreaColor(area.name)
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {areas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getAreaColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista de Áreas */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {areas.map(area => {
                  const areaStaff = staff.filter(s => s.area_name === area.name).length;
                  const percentage = Math.round((areaStaff / staff.length) * 100);
                  const areaColor = getAreaColor(area.name);
                  
                  return (
                    <div key={area.id} className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: areaColor }} />
                        <span className="text-gray-700">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{areaStaff} personal</span>
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

        {/* Columna Derecha - Inventario */}
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
            <div className="bg-white rounded-xl shadow-lg p-4" style={{ height: '628px' }}>
              <div className="space-y-3">
                {inventory.map(item => {
                  const stockPercentage = (item.quantity / (item.minimum_quantity || 1)) * 100;
                  const status = stockPercentage <= 25 ? 'critical' : 
                               stockPercentage <= 50 ? 'low' : 
                               stockPercentage <= 75 ? 'medium' : 'good';
                  const statusColors = {
                    critical: 'text-red-500 bg-red-50',
                    low: 'text-orange-500 bg-orange-50',
                    medium: 'text-yellow-500 bg-yellow-50',
                    good: 'text-green-500 bg-green-50'
                  };
                  
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.category || 'Sin categoría'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
                          {item.quantity} {item.unit_of_measure || 'unidades'}
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-1 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              Stock mínimo: {item.minimum_quantity || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold inline-block text-gray-600">
                              {stockPercentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex h-2 overflow-hidden bg-gray-100 rounded">
                          <div 
                            className={`h-2 rounded transition-all ${
                              status === 'critical' ? 'bg-red-500' : 
                              status === 'low' ? 'bg-orange-500' : 
                              status === 'medium' ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${stockPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tareas por Área - ahora fuera del grid principal */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tareas por Área</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {areasTasks.map(area => {
            const completedTasks = area.tasks.filter(t => t.status === 'completed').length;
            const progress = `${completedTasks}/${area.tasks.length}`;
            const progressPercentage = (completedTasks / area.tasks.length) * 100;
            const areaColor = getAreaColor(area.name);

            return (
              <div key={area.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-l-4" style={{ borderColor: areaColor }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: areaColor }}>{area.name}</h3>
                    <span className="text-sm text-gray-500">{area.tasks.length} tareas</span>
                  </div>
                  <div className="space-y-4">
                    {area.tasks.map(task => (
                      <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-gray-600">Asignado a: {task.assigned_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Inicio: {new Date(task.created_at || '').toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Finalización: {task.status === 'completed' ? 'Completado' : 'En progreso'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Progreso</span>
                    <span className="text-sm" style={{ color: areaColor }}>{progress}</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-1 rounded-full" 
                      style={{ 
                        width: `${progressPercentage}%`,
                        backgroundColor: areaColor
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const getAreaColor = (areaName: string): string => {
  // Normalizar el nombre del área (quitar acentos y convertir a minúsculas)
  const normalizedName = areaName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const colorMap: { [key: string]: string } = {
    // Áreas de recepción y espera
    'area de recepcion': '#3b82f6',
    'area recepcion': '#3b82f6',
    'recepcion': '#3b82f6',
    'sala de espera': '#0ea5e9',

    // Áreas médicas y procedimientos
    'consultorio de oncologia': '#22c55e',
    'consultorio oncologia': '#22c55e',
    'oncologia': '#22c55e',
    'sala de procedimientos': '#f43f5e',
    'procedimientos': '#f43f5e',
    'sala de reanimacion': '#ef4444',
    'reanimacion': '#ef4444',
    'triage': '#22c55e',

    // Áreas de servicio y almacenamiento
    'bano publico medicina': '#ef4444',
    'banos': '#ef4444',
    'cto septico': '#f59e0b',
    'cuarto septico': '#f59e0b',
    'cuarto de aseo': '#8b5cf6',
    'aseo': '#8b5cf6',
    'cuarto de urgencias': '#10b981',
    'urgencias': '#10b981',
    'cuarto de descanso': '#0891b2',
    'descanso': '#0891b2',
    'cuarto de medicamento': '#6366f1',
    'medicamento': '#6366f1',
    'cuarto de ropa limpia': '#22c55e',
    'ropa limpia': '#22c55e',
    'cuarto de ropa sucia': '#f43f5e',
    'ropa sucia': '#f43f5e',

    // Depósitos y almacenes
    'deposito': '#6366f1',
    'deposito de medicamentos': '#6366f1',
    'medicamentos': '#6366f1',
    'deposito de residuos': '#f43f5e',
    'residuos': '#f43f5e',

    // Áreas administrativas y de personal
    'estar de enfermeria': '#0ea5e9',
    'enfermeria': '#0ea5e9',
    'estacion de enfermeria': '#0ea5e9',
    'oficina de jefe de enfermeria': '#3b82f6',
    'jefe enfermeria': '#3b82f6',
    'oficina del jefe del servicio': '#8b5cf6',
    'jefe servicio': '#8b5cf6',
    'sala de reuniones': '#f97316',
    'reuniones': '#f97316',

    // Áreas de circulación
    'pasillo de acceso entrada': '#64748b',
    'pasillo entrada': '#64748b',
    'escalera de emergencia': '#ef4444',
    'escalera emergencia': '#ef4444',

    // Salas de hospitalización
    'sala de hospitalizacion': '#14b8a6',
    'sala de hospitalizacion 1': '#14b8a6',
    'sala de hospitalizacion 2': '#a855f7',
    'sala de hospitalizacion 4': '#06b6d4',
    'sala de hospitalizacion 5': '#8b5cf6',
    'sala de hospitalizacion 6': '#f97316',
    'sala hospitalizacion 1, 2, 4, 5, 6': '#14b8a6',

    // Habitaciones (1-20)
    'habitacion 1': '#14b8a6',
    'habitacion1': '#14b8a6',
    'hab 1': '#14b8a6',
    'habitacion 2': '#a855f7',
    'habitacion2': '#a855f7',
    'hab 2': '#a855f7',
    'habitacion 3': '#ec4899',
    'habitacion3': '#ec4899',
    'hab 3': '#ec4899',
    'habitacion 4': '#06b6d4',
    'habitacion4': '#06b6d4',
    'hab 4': '#06b6d4',
    'habitacion 5': '#8b5cf6',
    'habitacion5': '#8b5cf6',
    'hab 5': '#8b5cf6',
    'habitacion 6': '#f97316',
    'habitacion6': '#f97316',
    'hab 6': '#f97316',
    'habitacion 7': '#84cc16',
    'habitacion7': '#84cc16',
    'hab 7': '#84cc16',
    'habitacion 8': '#6366f1',
    'habitacion8': '#6366f1',
    'hab 8': '#6366f1',
    'habitacion 9': '#14b8a6',
    'habitacion9': '#14b8a6',
    'hab 9': '#14b8a6',
    'habitacion 10': '#0ea5e9',
    'habitacion10': '#0ea5e9',
    'hab 10': '#0ea5e9',
    'habitacion 11': '#a855f7',
    'habitacion11': '#a855f7',
    'hab 11': '#a855f7',
    'habitacion 12': '#f43f5e',
    'habitacion12': '#f43f5e',
    'hab 12': '#f43f5e',
    'habitacion 13': '#22c55e',
    'habitacion13': '#22c55e',
    'hab 13': '#22c55e',
    'habitacion 14': '#f97316',
    'habitacion14': '#f97316',
    'hab 14': '#f97316',
    'habitacion 15': '#3b82f6',
    'habitacion15': '#3b82f6',
    'hab 15': '#3b82f6',
    'habitacion 16': '#8b5cf6',
    'habitacion16': '#8b5cf6',
    'hab 16': '#8b5cf6',
    'habitacion 17': '#ef4444',
    'habitacion17': '#ef4444',
    'hab 17': '#ef4444',
    'habitacion 18': '#06b6d4',
    'habitacion18': '#06b6d4',
    'hab 18': '#06b6d4',
    'habitacion 19': '#84cc16',
    'habitacion19': '#84cc16',
    'hab 19': '#84cc16',
    'habitacion 20': '#6366f1',
    'habitacion20': '#6366f1',
    'hab 20': '#6366f1',

    // Área general
    'general': '#64748b'
  };

  return colorMap[normalizedName] || '#64748b'; // Color por defecto gris si no se encuentra el área
};