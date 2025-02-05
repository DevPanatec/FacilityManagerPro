'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaChartBar, FaCalendarAlt, FaUserClock, FaCheckDouble } from 'react-icons/fa';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  averageCompletionTime: number;
  completionRate: number;
  byUser: {
    [key: string]: {
      total: number;
      completed: number;
      name: string;
    };
  };
  byArea: {
    [key: string]: {
      total: number;
      completed: number;
      name: string;
    };
  };
}

export default function TaskReportsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
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

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Calcular la fecha inicial según el rango seleccionado
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Obtener todas las tareas en el rango de fechas
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to (
            id,
            first_name,
            last_name
          ),
          area:area_id (
            id,
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (tasksError) throw tasksError;

      // Procesar las estadísticas
      const taskStats: TaskStats = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        pending: tasks?.filter(t => t.status === 'pending').length || 0,
        averageCompletionTime: 0,
        completionRate: 0,
        byUser: {},
        byArea: {}
      };

      // Calcular tasa de finalización
      taskStats.completionRate = taskStats.total > 0 
        ? (taskStats.completed / taskStats.total) * 100 
        : 0;

      // Calcular tiempo promedio de finalización
      const completedTasks = tasks?.filter(t => t.status === 'completed' && t.completed_at && t.start_time) || [];
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((acc, task) => {
          const start = new Date(task.start_time).getTime();
          const end = new Date(task.completed_at!).getTime();
          return acc + (end - start);
        }, 0);
        taskStats.averageCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60); // Convertir a horas
      }

      // Agrupar por usuario
      tasks?.forEach(task => {
        const userId = task.assigned_to;
        if (!taskStats.byUser[userId]) {
          taskStats.byUser[userId] = {
            total: 0,
            completed: 0,
            name: `${task.assignee.first_name} ${task.assignee.last_name}`
          };
        }
        taskStats.byUser[userId].total++;
        if (task.status === 'completed') {
          taskStats.byUser[userId].completed++;
        }
      });

      // Agrupar por área
      tasks?.forEach(task => {
        const areaId = task.area_id;
        if (!taskStats.byArea[areaId]) {
          taskStats.byArea[areaId] = {
            total: 0,
            completed: 0,
            name: task.area.name
          };
        }
        taskStats.byArea[areaId].total++;
        if (task.status === 'completed') {
          taskStats.byArea[areaId].completed++;
        }
      });

      setStats(taskStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Error al cargar las estadísticas');
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaChartBar className="text-blue-200" />
                Reportes y Estadísticas
              </h1>
              <p className="mt-2 text-blue-100">
                Análisis detallado del rendimiento y progreso de las tareas
              </p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${dateRange === range
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-700 text-white hover:bg-blue-600'
                    }`}
                >
                  {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {stats && (
          <div className="p-8 space-y-8">
            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6 border border-purple-100">
                <div className="flex items-center gap-2 text-purple-600">
                  <FaChartBar className="text-2xl" />
                  <div className="text-sm font-medium">Total de Tareas</div>
                </div>
                <div className="mt-2 text-3xl font-bold text-purple-700">
                  {stats.total}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center gap-2 text-green-600">
                  <FaCheckDouble className="text-2xl" />
                  <div className="text-sm font-medium">Tasa de Finalización</div>
                </div>
                <div className="mt-2 text-3xl font-bold text-green-700">
                  {stats.completionRate.toFixed(1)}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600">
                  <FaUserClock className="text-2xl" />
                  <div className="text-sm font-medium">Tiempo Promedio</div>
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-700">
                  {stats.averageCompletionTime.toFixed(1)}h
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6 border border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-600">
                  <FaCalendarAlt className="text-2xl" />
                  <div className="text-sm font-medium">En Progreso</div>
                </div>
                <div className="mt-2 text-3xl font-bold text-yellow-700">
                  {stats.inProgress}
                </div>
              </div>
            </div>

            {/* Estadísticas por usuario */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Rendimiento por Usuario</h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {Object.entries(stats.byUser).map(([userId, userData]) => (
                    <div key={userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{userData.name}</h4>
                        <p className="text-sm text-gray-500">
                          {userData.completed} de {userData.total} tareas completadas
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${(userData.completed / userData.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Estadísticas por área */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Distribución por Área</h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {Object.entries(stats.byArea).map(([areaId, areaData]) => (
                    <div key={areaId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{areaData.name}</h4>
                        <p className="text-sm text-gray-500">
                          {areaData.completed} de {areaData.total} tareas completadas
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(areaData.completed / areaData.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 