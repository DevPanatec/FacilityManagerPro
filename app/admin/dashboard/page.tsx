'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface AreaStats {
  total: number;
  completadas: number;
}

interface DashboardData {
  asignacionesPendientes: number;
  asignacionesEnProgreso: number;
  asignacionesCompletadas: number;
  personalActivo: number;
  tiempoPromedioTarea: string;
  tasaCompletitud: number;
  asignacionesPorArea: [string, AreaStats][];
  asignacionesPorUsuario: [string, AreaStats][];
}

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    asignacionesPendientes: 0,
    asignacionesEnProgreso: 0,
    asignacionesCompletadas: 0,
    personalActivo: 0,
    tiempoPromedioTarea: '0h',
    tasaCompletitud: 0,
    asignacionesPorArea: [],
    asignacionesPorUsuario: []
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario actual y su organización
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Usuario no encontrado');

      // Calcular la fecha inicial según el periodo seleccionado
      const now = new Date();
      let startDate = new Date();
      switch (selectedPeriod) {
        case 'dia':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'semana':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'mes':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Obtener asignaciones
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          users:user_id (
            id,
            first_name,
            last_name
          ),
          areas:area_id (
            id,
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', startDate.toISOString());

      if (assignmentsError) throw assignmentsError;

      // Obtener usuarios activos
      const { data: activeUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      if (usersError) throw usersError;

      // Calcular estadísticas
      const pendientes = assignments?.filter(a => a.status === 'pending').length || 0;
      const enProgreso = assignments?.filter(a => a.status === 'in_progress').length || 0;
      const completadas = assignments?.filter(a => a.status === 'completed').length || 0;
      const total = assignments?.length || 0;

      // Calcular tiempo promedio de completitud
      const completedAssignments = assignments?.filter(a => 
        a.status === 'completed' && a.start_time && a.completed_at
      ) || [];

      let tiempoPromedio = '0h';
      if (completedAssignments.length > 0) {
        const totalTime = completedAssignments.reduce((acc, curr) => {
          const start = new Date(curr.start_time);
          const end = new Date(curr.completed_at);
          return acc + (end.getTime() - start.getTime());
        }, 0);
        const promedioHoras = (totalTime / completedAssignments.length) / (1000 * 60 * 60);
        tiempoPromedio = `${promedioHoras.toFixed(1)}h`;
      }

      // Calcular asignaciones por área
      const asignacionesPorArea = assignments?.reduce((acc, curr) => {
        const areaName = curr.areas?.name || 'Sin área';
        if (!acc[areaName]) {
          acc[areaName] = { total: 0, completadas: 0 };
        }
        acc[areaName].total++;
        if (curr.status === 'completed') {
          acc[areaName].completadas++;
        }
        return acc;
      }, {});

      // Calcular asignaciones por usuario
      const asignacionesPorUsuario = assignments?.reduce((acc, curr) => {
        const userName = `${curr.users?.first_name} ${curr.users?.last_name}` || 'Usuario desconocido';
        if (!acc[userName]) {
          acc[userName] = { total: 0, completadas: 0 };
        }
        acc[userName].total++;
        if (curr.status === 'completed') {
          acc[userName].completadas++;
        }
        return acc;
      }, {});

      setDashboardData({
        asignacionesPendientes: pendientes,
        asignacionesEnProgreso: enProgreso,
        asignacionesCompletadas: completadas,
        personalActivo: activeUsers?.length || 0,
        tiempoPromedioTarea: tiempoPromedio,
        tasaCompletitud: total > 0 ? Number(((completadas / total) * 100).toFixed(1)) : 0,
        asignacionesPorArea: Object.entries(asignacionesPorArea || {}) as [string, AreaStats][],
        asignacionesPorUsuario: Object.entries(asignacionesPorUsuario || {}) as [string, AreaStats][]
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
      toast.error('Error al cargar los datos del dashboard');
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
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <p className="text-blue-100 mt-1">Resumen general del sistema</p>
          </div>
          <div className="flex gap-2">
            {['dia', 'semana', 'mes'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedPeriod === period 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700/50 text-white hover:bg-blue-700'}`}
              >
                {period === 'dia' ? 'Día' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Asignaciones Pendientes</h2>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.asignacionesPendientes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full hover:bg-green-200 transition-colors">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Personal Activo</h2>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.personalActivo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Tiempo Promedio</h2>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.tiempoPromedioTarea}</p>
              <p className="text-xs text-purple-600 mt-1">Por tarea completada</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Eficiencia Global</h2>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.tasaCompletitud}%</p>
              <p className="text-xs text-yellow-600 mt-1">Tasa de completitud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Paneles de Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Asignaciones por Área */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Asignaciones por Área</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.asignacionesPorArea.map(([area, stats]) => (
                <div key={area} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{area}</h4>
                    <p className="text-sm text-gray-500">
                      {stats.completadas} de {stats.total} completadas
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(stats.completadas / stats.total) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Rendimiento por Usuario */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Rendimiento por Usuario</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.asignacionesPorUsuario.map(([usuario, stats]) => (
                <div key={usuario} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{usuario}</h4>
                    <p className="text-sm text-gray-500">
                      {stats.completadas} de {stats.total} completadas
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(stats.completadas / stats.total) * 100}%`
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
    </div>
  );
}
