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
        .from('employees')
        .select('count')
        .eq('organization_id', userProfile.organization_id)
        .single();

      if (testError) {
        console.log('Error de prueba de acceso:', testError);
      } else {
        console.log('Acceso exitoso a employees, conteo:', testAccess);
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
        .not('role', 'eq', 'superadmin')
        .limit(10);

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
        position: 'No especificado',
        department: 'General',
        status: member.status || 'Activo',
        hire_date: new Date().toISOString(),
        role: member.role,
        contact_info: {},
        created_at: null,
        updated_at: null,
        name: `${member.first_name} ${member.last_name}`,
        area_name: 'General'
      }));

      setStaff(formattedStaff as FormattedEmployee[]);

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
        overtime: shift.overtime_minutes ? `${shift.overtime_minutes} min extra` : null
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
      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Turnos */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Turnos Activos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <button
                key={shift.id}
                onClick={() => {
                  setSelectedShift(shift);
                  setShowShiftModal(true);
                }}
                className="bg-white rounded-xl shadow-lg p-6 transform transition-all 
                         hover:scale-105 hover:shadow-xl focus:outline-none"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{shift.name}</h3>
                    <p className="text-sm text-gray-500">{shift.schedule}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${shift.color}20`, color: shift.color }}>
                    {shift.active_count} activos
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Capacidad</span>
                    <span className="font-medium">{shift.active_count}/{shift.total_capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(shift.active_count / shift.total_capacity) * 100}%`,
                        backgroundColor: shift.color
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
                      data={areas}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="staff_count"
                    >
                      {areas.map((entry, index) => (
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
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Personal: {data.staff_count}
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
                {areas.map((area) => (
                  <div 
                    key={area.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-medium text-gray-700">
                        {area.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {area.staff_count} personal
                      </span>
                      <span className="text-sm font-medium" style={{ color: area.color }}>
                        {`${Math.round((area.staff_count / areas.reduce((acc, curr) => acc + curr.staff_count, 0)) * 100)}%`}
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
            {/* Este componente ya está conectado a Supabase a través del componente InventoryPage */}
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
          {areasTasks.map((area) => (
            <div 
              key={area.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-l-4" style={{ borderColor: area.color }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: area.color }}>
                    {area.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {area.tasks.length} tareas
                  </span>
                </div>
                <div className="space-y-4">
                  {area.tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">{task.title}</span>
                        <span className="text-sm text-gray-600">{task.description}</span>
                        <span className="text-sm text-gray-500">
                          Asignado a: {task.assigned_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          Estado: {task.status === 'pending' ? 'Pendiente' : 
                                  task.status === 'in_progress' ? 'En progreso' : 
                                  task.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                        <span className={`text-sm ${
                          task.priority === 'urgent' ? 'text-red-600' :
                          task.priority === 'high' ? 'text-red-500' :
                          task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          Prioridad: {
                            task.priority === 'urgent' ? 'Urgente' :
                            task.priority === 'high' ? 'Alta' :
                            task.priority === 'medium' ? 'Media' : 'Baja'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="w-3 h-3" />
                        <span>
                          {task.due_date ? `Vence: ${new Date(task.due_date).toLocaleString()}` : 'Sin fecha límite'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow h-1.5 bg-gray-200 rounded-full">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: task.status === 'completed' ? '100%' : 
                                    task.status === 'in_progress' ? '50%' : '0%',
                              backgroundColor: area.color
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: area.color }}>
                          {task.status === 'completed' ? '100%' : 
                           task.status === 'in_progress' ? '50%' : '0%'}
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