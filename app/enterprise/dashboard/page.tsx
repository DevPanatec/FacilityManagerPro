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

interface Shift {
  id: string
  name: string
  schedule: string
  total_capacity: number
  active_count: number
  color: string
}

interface Area {
  id: string
  name: string
  color: string
  staff_count: number
}

interface Task {
  id: string
  description: string
  assigned_to: string
  assigned_name?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  start_time: string | null
  end_time: string | null
}

interface AreaWithTasks extends Area {
  tasks: Task[]
}

interface Staff {
  id: string
  user_id: string
  name: string
  area_id: string
  area_name: string
  shift_id: string
  role: string
  status: string
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

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Cargar turnos
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('name');

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

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
          *,
          users (
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (tasksError) throw tasksError;

      // Agrupar tareas por área
      const areasWithTasks = areasData?.map(area => ({
        ...area,
        tasks: tasksData?.filter(task => task.area_id === area.id).map(task => ({
          ...task,
          assigned_name: task.users?.name
        })) || []
      })) || [];

      setAreasTasks(areasWithTasks);

      // Cargar personal
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          users (
            name
          ),
          areas (
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (staffError) throw staffError;

      const formattedStaff = staffData?.map(member => ({
        ...member,
        name: member.users?.name,
        area_name: member.areas?.name
      })) || [];

      setStaff(formattedStaff);

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
                      <h4 className="text-sm font-medium text-gray-900">
                        {task.description}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Asignado a {task.assigned_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="w-3 h-3" />
                        <span>
                          {task.start_time ? new Date(task.start_time).toLocaleString() : 'No iniciada'}
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
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {task.status.replace('_', ' ')}
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