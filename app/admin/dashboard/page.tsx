'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface DashboardData {
  asignacionesPendientes: {
    cantidad: number;
    variacion: number;
  };
  personalActivo: number;
  tiempoPromedio: string;
  eficienciaGlobal: number;
  productividadTurno: {
    manana: number;
    tarde: number;
    noche: number;
  };
  alertasInventario: {
    producto: string;
    stockActual: number;
    stockMinimo: number;
    itemsNecesarios: number;
  }[];
  estadoAsignaciones: {
    dia: string;
    fecha: string;
    completadas: number;
    pendientes: number;
    enProgreso: number;
    total: number;
  }[];
  frecuenciaLimpieza: {
    sala: string;
    frecuencia: number;
    porcentaje: number;
  }[];
  estadoTareas: {
    completadas: number;
    enProgreso: number;
    pendientes: number;
  };
}

interface Room {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  created_at: string;
  organization_id: string;
}

interface WorkShift {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  work_shifts: WorkShift[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  created_at: string;
  start_time?: string;
  completed_at?: string;
  area_id?: string;
  sala_id?: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    work_shifts: WorkShift[];
  };
}

interface UserMapType {
  [key: string]: any;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [selectedPeriod, setSelectedPeriod] = useState('dia');

  // Función para asignar colores a las áreas
  const getAreaColor = (areaName: string): string => {
    const colors: { [key: string]: string } = {
      'Baños': '#4263eb',
      'Cocina': '#40c057',
      'Oficinas': '#f59f00',
      'Recepción': '#e64980',
      'Sala de Reuniones': '#7950f2',
      'Almacén': '#1098ad'
    };
    return colors[areaName] || '#4263eb'; // Color por defecto si no hay coincidencia
  };

  const getRoomColor = (roomName: string): string => {
    const colors: { [key: string]: string } = {
      'Baño': '#4263eb',
      'Cocina': '#40c057',
      'Oficina': '#f59f00',
      'Recepción': '#e64980',
      'Sala de Reuniones': '#7950f2',
      'Almacén': '#1098ad',
      'Laboratorio': '#fd7e14',
      'Aula': '#20c997'
    };
    return colors[roomName] || '#4263eb'; // Color por defecto si no hay coincidencia
  };

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    asignacionesPendientes: {
      cantidad: 0,
      variacion: 0
    },
    personalActivo: 0,
    tiempoPromedio: '0min',
    eficienciaGlobal: 0,
    productividadTurno: {
      manana: 0,
      tarde: 0,
      noche: 0
    },
    alertasInventario: [],
    estadoAsignaciones: [],
    frecuenciaLimpieza: [],
    estadoTareas: {
      completadas: 0,
      enProgreso: 0,
      pendientes: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');

      // Calcular fechas para el período seleccionado
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Calcular inicio de la semana (Lunes)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      
      // Calcular fin de la semana (Viernes)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 5);
      endOfWeek.setHours(23, 59, 59, 999);

      // Primero obtener solo las tareas básicas sin relaciones
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          assigned_to,
          created_at,
          start_time,
          completed_at,
          area_id,
          sala_id,
          organization_id
        `)
        .eq('organization_id', userProfile.organization_id);

      if (taskError) {
        console.error('Error en consulta de tareas:', taskError);
        throw new Error('Error al obtener las tareas: ' + taskError.message);
      }

      console.log('Datos básicos de tareas:', taskData);

      // Si la consulta básica funciona, obtener los usuarios asignados
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name
        `)
        .in('id', (taskData || []).map(task => task.assigned_to).filter(Boolean));

      if (usersError) {
        console.error('Error al obtener usuarios:', usersError);
        throw new Error('Error al obtener usuarios: ' + usersError.message);
      }

      // Crear un mapa de usuarios para fácil acceso
      const usersMap = (usersData || []).reduce((acc: UserMapType, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as UserMapType);

      // Combinar los datos de tareas con los usuarios
      const tasksWithUsers = (taskData || []).map(task => ({
        ...task,
        user: task.assigned_to ? usersMap[task.assigned_to] : null
      }));

      console.log('Tareas con usuarios:', tasksWithUsers);

      // Obtener salas
      const { data: salas, error: salasError } = await supabase
        .from('salas')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('estado', true);

      if (salasError) {
        console.error('Error en consulta de salas:', salasError);
        throw new Error('Error al obtener las salas: ' + salasError.message);
      }

      // Inicializar arrays vacíos si no hay datos
      const taskDataArray = tasksWithUsers || [];
      const salasArray = salas || [];

      // Calcular frecuencia de limpieza
      const frecuenciaLimpieza = salasArray.map(sala => {
        const asignacionesSala = taskDataArray.filter(task => 
          task.sala_id === sala.id || 
          task.area_id === sala.id
        );
        
        const diasEnPeriodo = selectedPeriod === 'dia' ? 1 : selectedPeriod === 'semana' ? 7 : 30;
        const frecuencia = asignacionesSala.length;
        const frecuenciaPromedio = frecuencia / diasEnPeriodo;
        const objetivoDiario = 2;
        const porcentaje = Math.round((frecuenciaPromedio / objetivoDiario) * 100);

        return {
          sala: sala.nombre,
          frecuencia,
          porcentaje: Math.min(porcentaje, 100)
        };
      });

      // Calcular estadísticas generales
      const completadas = taskDataArray.filter(t => t.status === 'completed').length;
      const pendientes = taskDataArray.filter(t => 
        t.status === 'pending' && t.assigned_to // Solo contar las que están asignadas
      ).length;
      const enProgreso = taskDataArray.filter(t => t.status === 'in_progress').length;
      const total = taskDataArray.length;

      console.log('Desglose de tareas:', {
        total,
        pendientes,
        pendientesSinAsignar: taskDataArray.filter(t => t.status === 'pending' && !t.assigned_to).length,
        pendientesAsignadas: taskDataArray.filter(t => t.status === 'pending' && t.assigned_to).length,
        enProgreso,
        completadas
      });

      // Calcular tiempo promedio por tarea
      const completedWithTimes = taskDataArray.filter(t => 
        t.status === 'completed' && t.start_time && t.completed_at
      );

      let tiempoPromedio = '0min';

      if (completedWithTimes.length > 0) {
        const totalMinutes = completedWithTimes.reduce((acc, curr) => {
          if (!curr.start_time || !curr.completed_at) return acc;
          const start = new Date(curr.start_time);
          const end = new Date(curr.completed_at);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60);
        }, 0);
        tiempoPromedio = `${Math.round(totalMinutes / completedWithTimes.length)}min`;
      }

      // Obtener personal activo (sin filtrar por status)
      const { data: activeUsers, error: usersActiveError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      if (usersActiveError) {
        console.error('Error al obtener usuarios activos:', usersActiveError);
        throw new Error('Error al obtener usuarios activos: ' + usersActiveError.message);
      }

      // Preparar datos de estado de asignaciones por día
      const diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
      const estadoAsignaciones = diasSemana.map((dia, index) => {
        const fechaDia = new Date(startOfWeek);
        fechaDia.setDate(startOfWeek.getDate() + index);
        
        const tareasDia = taskDataArray.filter(task => {
          const fechaTarea = new Date(task.created_at);
          return fechaTarea.getDate() === fechaDia.getDate() &&
                 fechaTarea.getMonth() === fechaDia.getMonth() &&
                 fechaTarea.getFullYear() === fechaDia.getFullYear();
        });

        const completadas = tareasDia.filter(t => t.status === 'completed').length;
        const pendientes = tareasDia.filter(t => t.status === 'pending').length;
        const enProgreso = tareasDia.filter(t => t.status === 'in_progress').length;
        const total = completadas + pendientes + enProgreso;

        return {
          dia,
          fecha: fechaDia.toISOString(),
          completadas,
          pendientes,
          enProgreso,
          total
        };
      });

      // Obtener inventario
      const { data: inventoryAlerts, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          quantity,
          min_stock,
          status,
          organization_id
        `)
        .eq('organization_id', userProfile.organization_id);

      console.log('Raw inventory data:', inventoryAlerts); // Debug log

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw new Error('Error al obtener inventario: ' + inventoryError.message);
      }

      // Formatear alertas de inventario y filtrar los que están bajo el mínimo
      const formattedAlerts = (inventoryAlerts || [])
        .filter(item => {
          console.log('Checking item:', item.name, {
            quantity: item.quantity,
            min_stock: item.min_stock,
            status: item.status
          });
          // Incluir items que:
          // 1. Tienen cantidad 0
          // 2. Tienen estado out_of_stock
          // 3. Tienen cantidad menor al stock mínimo
          return (
            item.quantity === 0 ||
            item.status === 'out_of_stock' ||
            (item.quantity < item.min_stock && item.min_stock > 0)
          );
        })
        .map(item => ({
          producto: item.name,
          stockActual: item.quantity || 0,
          stockMinimo: item.min_stock || 0,
          itemsNecesarios: Math.max(0, (item.min_stock || 0) - (item.quantity || 0))
        }));

      console.log('Final formatted alerts:', formattedAlerts); // Ver alertas finales

      // Actualizar el estado
      setDashboardData({
        ...dashboardData,
        asignacionesPendientes: {
          cantidad: pendientes,
          variacion: Math.round((pendientes - (taskDataArray.filter(t => t.status === 'pending' && t.assigned_to).length || 0)) / (taskDataArray.filter(t => t.status === 'pending' && t.assigned_to).length || 1) * 100)
        },
        personalActivo: activeUsers?.length || 0,
        tiempoPromedio,
        eficienciaGlobal: total > 0 ? Math.round((completadas / total) * 100) : 0,
        productividadTurno: {
          manana: taskDataArray.filter(t => {
            // Verificar si la tarea está asignada y tiene estado pendiente o en progreso
            if (!t.assigned_to || !['pending', 'in_progress'].includes(t.status)) {
              return false;
            }
            
            // Verificar si es turno mañana (6:00 - 13:59)
            const taskTime = t.start_time ? new Date(`2000-01-01T${t.start_time}`) : null;
            return taskTime ? (taskTime.getHours() >= 6 && taskTime.getHours() < 14) : true;
          }).length,
          tarde: taskDataArray.filter(t => {
            // Verificar si la tarea está asignada y tiene estado pendiente o en progreso
            if (!t.assigned_to || !['pending', 'in_progress'].includes(t.status)) {
              return false;
            }

            // Verificar si es turno tarde (14:00 - 21:59)
            const taskTime = t.start_time ? new Date(`2000-01-01T${t.start_time}`) : null;
            return taskTime ? (taskTime.getHours() >= 14 && taskTime.getHours() < 22) : true;
          }).length,
          noche: taskDataArray.filter(t => {
            // Verificar si la tarea está asignada y tiene estado pendiente o en progreso
            if (!t.assigned_to || !['pending', 'in_progress'].includes(t.status)) {
              return false;
            }

            // Verificar si es turno noche (22:00 - 5:59)
            const taskTime = t.start_time ? new Date(`2000-01-01T${t.start_time}`) : null;
            return taskTime ? (taskTime.getHours() >= 22 || taskTime.getHours() < 6) : true;
          }).length
        },
        alertasInventario: formattedAlerts,
        estadoAsignaciones,
        frecuenciaLimpieza,
        estadoTareas: {
          completadas,
          pendientes,
          enProgreso
        }
      });

      // Agregar logs para depuración
      console.log('Estadísticas de tareas:', {
        total: taskDataArray.length,
        asignadas: taskDataArray.filter(t => t.assigned_to).length,
        conUsuarioYTurno: taskDataArray.filter(t => t.assigned_to && t.user?.work_shifts).length,
        activas: taskDataArray.filter(t => ['pending', 'in_progress'].includes(t.status)).length
      });

    } catch (error) {
      console.error('Error loading data:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al cargar los datos del dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4263eb]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-[#4263eb] -mx-4 sm:-mx-6 mt-2 px-4 sm:px-6 py-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl font-bold text-white">Panel de Control</h1>
            <p className="text-sm text-blue-100">Resumen general del sistema</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-1 text-sm font-medium rounded-full bg-white text-[#4263eb]">
              Día
            </button>
            <button className="flex-1 sm:flex-none px-4 py-1 text-sm font-medium rounded-full text-white hover:bg-blue-600">
              Semana
            </button>
            <button className="flex-1 sm:flex-none px-4 py-1 text-sm font-medium rounded-full text-white hover:bg-blue-600">
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asignaciones Pendientes */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Asignaciones Pendientes</p>
              <p className="text-2xl font-bold">{dashboardData.asignacionesPendientes.cantidad}</p>
              <p className="text-xs text-green-600">+{dashboardData.asignacionesPendientes.variacion}% vs ayer</p>
            </div>
          </div>
        </div>

        {/* Personal Activo */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Personal Activo</p>
              <p className="text-2xl font-bold">{dashboardData.personalActivo}</p>
              <p className="text-xs text-gray-500">Personal actual en turno</p>
            </div>
          </div>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold">{dashboardData.tiempoPromedio}</p>
              <p className="text-xs text-gray-500">Por tarea completada</p>
            </div>
          </div>
        </div>

        {/* Eficiencia Global */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Eficiencia Global</p>
              <p className="text-2xl font-bold">{dashboardData.eficienciaGlobal}%</p>
              <p className="text-xs text-gray-500">Tasa de completitud</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productividad por Turno */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Productividad por Turno</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Turno Mañana */}
            <div className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Mañana</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">{dashboardData.productividadTurno.manana} tareas</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.manana / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-300 bg-blue-500"
                />
              </div>
            </div>

            {/* Turno Tarde */}
            <div className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Tarde</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">{dashboardData.productividadTurno.tarde} tareas</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.tarde / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-300 bg-blue-500"
                />
              </div>
            </div>

            {/* Turno Noche */}
            <div className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Noche</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">{dashboardData.productividadTurno.noche} tareas</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.noche / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-300 bg-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Inventario */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-bold text-gray-900">Alertas de Inventario</h3>
                <span className="text-sm text-red-500">{dashboardData.alertasInventario.length} items en bajo stock</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col h-[300px]">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {dashboardData.alertasInventario.length > 0 ? (
                  <>
                    {dashboardData.alertasInventario.map((item, index) => (
                      <div key={index} className="space-y-2 hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${item.stockActual === 0 ? 'bg-red-500' : 'bg-yellow-500'} rounded-full`} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.producto}</p>
                              <p className="text-xs text-gray-500">{item.itemsNecesarios} items necesitan reposición</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs">Stock actual: {item.stockActual}</p>
                            <p className={`text-[11px] ${item.stockActual === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                              Mínimo requerido: {item.stockMinimo}
                            </p>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div
                              className="h-2 rounded-full bg-gray-400"
                              style={{ width: `${(item.stockActual / item.stockMinimo) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay items con stock bajo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Asignaciones */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Estado de Asignaciones</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="relative h-64">
              <div className="flex justify-between items-end h-full">
                {dashboardData.estadoAsignaciones.map((dia, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 w-1/6 relative group">
                    <div className="w-full flex flex-col gap-1">
                      <div 
                        className="bg-blue-500 rounded-t-lg transition-all duration-300" 
                        style={{ 
                          height: `${Math.min(
                            Math.max((dia.completadas / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                            150
                          )}px` 
                        }} 
                      />
                      <div 
                        className="bg-red-500 rounded-b-lg transition-all duration-300" 
                        style={{ 
                          height: `${Math.min(
                            Math.max((dia.pendientes / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                            150
                          )}px` 
                        }} 
                      />
                      {dia.enProgreso > 0 && (
                        <div 
                          className="bg-yellow-500 rounded-b-lg transition-all duration-300" 
                          style={{ 
                            height: `${Math.min(
                              Math.max((dia.enProgreso / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                              150
                            )}px` 
                          }} 
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-600">{dia.dia}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <p className="text-sm text-blue-600">Completadas: {dia.completadas}</p>
                      <p className="text-sm text-red-600">Pendientes: {dia.pendientes}</p>
                      {dia.enProgreso > 0 && (
                        <p className="text-sm text-yellow-600">En Progreso: {dia.enProgreso}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-4 right-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-blue-600">Completadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-red-600">Pendientes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Frecuencia de Limpieza */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Frecuencia de Limpieza por Sala</h3>
            </div>
          </div>
          <div className="h-[300px] sm:h-[400px] overflow-y-auto">
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.frecuenciaLimpieza.map((sala, index) => (
                  <div key={index} className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: getRoomColor(sala.sala) }} />
                        <span className="text-sm font-medium text-gray-700 truncate">{sala.sala}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 ml-2 flex-shrink-0">{sala.frecuencia}x</span>
                    </div>
                    <div className="relative pt-1 w-full">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(sala.porcentaje, 100)}%`,
                            backgroundColor: getRoomColor(sala.sala)
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
    </div>
  );
}
