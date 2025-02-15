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
    completadas: number;
    pendientes: number;
    enProgreso: number;
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
      today.setHours(0, 0, 0, 0); // Inicio del día actual
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Inicio del día siguiente

      // Obtener solo las tareas de hoy
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          start_time,
          completed_at,
          sala_id,
          type,
          parent_task_id,
          assigned_to
        `)
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .not('status', 'eq', 'cancelled')
        .is('parent_task_id', null); // Solo tareas principales, no subtareas

      console.log('Tareas sin procesar:', taskData?.map(task => ({
        id: task.id,
        titulo: task.title,
        created_at: task.created_at,
        hora_local: new Date(task.created_at).toLocaleTimeString()
      })));

      // Obtener los turnos y sus usuarios asignados
      const { data: workShifts } = await supabase
        .from('work_shifts')
        .select(`
          id,
          shift_type,
          user_id,
          users!work_shifts_user_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'scheduled');

      // Crear mapa de usuarios por turno
      const usuariosPorTurno = {
        morning: new Set(workShifts?.filter(ws => ws.shift_type === 'morning').map(ws => ws.user_id) || []),
        afternoon: new Set(workShifts?.filter(ws => ws.shift_type === 'afternoon').map(ws => ws.user_id) || []),
        night: new Set(workShifts?.filter(ws => ws.shift_type === 'night').map(ws => ws.user_id) || [])
      };

      console.log('Usuarios por turno:', {
        morning: Array.from(usuariosPorTurno.morning),
        afternoon: Array.from(usuariosPorTurno.afternoon),
        night: Array.from(usuariosPorTurno.night)
      });

      // Distribuir las tareas según el turno del usuario asignado
      const conteoTareasPorTurno = {
        manana: 0,
        tarde: 0,
        noche: 0
      };

      taskData?.forEach(task => {
        const userId = task.assigned_to;
        console.log(`Analizando tarea ${task.id} - ${task.title}`);
        console.log(`Usuario asignado: ${userId}`);
        
        if (userId) {
          if (usuariosPorTurno.morning.has(userId)) {
            conteoTareasPorTurno.manana++;
            console.log('Asignada a turno mañana');
          } else if (usuariosPorTurno.afternoon.has(userId)) {
            conteoTareasPorTurno.tarde++;
            console.log('Asignada a turno tarde');
          } else if (usuariosPorTurno.night.has(userId)) {
            conteoTareasPorTurno.noche++;
            console.log('Asignada a turno noche');
          } else {
            console.log('Usuario no está asignado a ningún turno');
          }
        } else {
          console.log('Tarea sin usuario asignado');
        }
      });

      const tareasPorTurno = {
        manana: conteoTareasPorTurno.manana,
        tarde: conteoTareasPorTurno.tarde,
        noche: conteoTareasPorTurno.noche
      };

      console.log('Resumen final de distribución por turno del usuario:', {
        'Turno mañana': tareasPorTurno.manana,
        'Turno tarde': tareasPorTurno.tarde,
        'Turno noche': tareasPorTurno.noche
      });

      // Actualizar productividad por turno
      const productividadTurno = {
        manana: tareasPorTurno.manana,
        tarde: tareasPorTurno.tarde,
        noche: tareasPorTurno.noche
      };

      console.log('Productividad por turno actualizada:', productividadTurno);

      // Obtener personal activo
      const { data: activeUsers } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('status', 'active');

      // Obtener inventario
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      console.log('Inventory data:', inventory); // Debug log

      // Filtrar items con bajo stock
      const lowStockItems = inventory?.filter(item => 
        item.quantity <= item.minimum_quantity
      ) || [];

      console.log('Low stock items:', lowStockItems); // Debug log

      // Preparar datos de inventario
      const alertasInventario = lowStockItems.map(item => ({
        producto: item.name,
        stockActual: item.quantity,
        stockMinimo: item.minimum_quantity,
        itemsNecesarios: item.minimum_quantity - item.quantity
      }));

      console.log('Alertas inventario:', alertasInventario); // Debug log

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
      }

      // Obtener áreas
      const { data: areas } = await supabase
        .from('areas')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      // Preparar datos de estado de asignaciones por día
      const diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
      const estadoAsignaciones = diasSemana.map(dia => {
        const tareasDia = taskData?.filter(task => {
          const fecha = new Date(task.created_at);
          const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3);
          return nombreDia === dia;
        }) || [];

        const completadas = tareasDia.filter(t => t.status === 'completed').length;
        const pendientes = tareasDia.filter(t => t.status === 'pending').length;
        const enProgreso = tareasDia.filter(t => t.status === 'in_progress').length;

        return {
          dia,
          completadas,
          pendientes,
          enProgreso
        };
      });

      console.log('Estado de asignaciones por día:', estadoAsignaciones);

      // Calcular métricas
      const pendientes = taskData?.filter(t => t.status === 'pending').length || 0;
      const completadas = taskData?.filter(t => t.status === 'completed').length || 0;
      const total = taskData?.length || 0;

      // Calcular tiempo promedio por tarea
      const completedWithTimes = taskData?.filter(t => 
        t.status === 'completed' && t.start_time && t.completed_at
      ) || [];

      let tiempoPromedio = '0min';
      if (completedWithTimes.length > 0) {
        const totalMinutes = completedWithTimes.reduce((acc, curr) => {
          const start = new Date(curr.start_time);
          const end = new Date(curr.completed_at);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60);
        }, 0);
        tiempoPromedio = `${Math.round(totalMinutes / completedWithTimes.length)}min`;
      }

      // Preparar datos de frecuencia de limpieza
      const { data: salas } = await supabase
        .from('salas')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .eq('estado', true);

      console.log('Salas obtenidas:', salas);

      const typedSalas = salas as Room[] | null;

      const frecuenciaLimpieza = typedSalas?.map(sala => {
        const asignacionesSala = taskData?.filter(a => a.sala_id === sala.id) || [];
        console.log('Asignaciones para sala', sala.nombre, ':', asignacionesSala);
        
        const frecuencia = Math.round(asignacionesSala.length / (selectedPeriod === 'dia' ? 1 : selectedPeriod === 'semana' ? 7 : 30));
        return {
          sala: sala.nombre,
          frecuencia,
          porcentaje: Math.round((frecuencia / 1) * 100)
        };
      }) || [];

      console.log('Frecuencia de limpieza calculada:', frecuenciaLimpieza);

      // Actualizar el estado con los conteos de tareas
      setDashboardData(prevData => ({
        ...prevData,
        estadoTareas: {
          completadas: tareasPorTurno.manana + tareasPorTurno.tarde + tareasPorTurno.noche,
          enProgreso: 0,
          pendientes: 0
        }
      }));

      setDashboardData({
        asignacionesPendientes: {
          cantidad: pendientes,
          variacion: Math.round((pendientes - (taskData?.filter(t => t.status === 'pending').length || 0)) / (taskData?.filter(t => t.status === 'pending').length || 0) * 100)
        },
        personalActivo: activeUsers?.length || 0,
        tiempoPromedio,
        eficienciaGlobal: total > 0 ? Math.round((completadas / total) * 100) : 0,
        productividadTurno: productividadTurno,
        alertasInventario,
        estadoAsignaciones,
        frecuenciaLimpieza,
        estadoTareas: {
          completadas: tareasPorTurno.manana + tareasPorTurno.tarde + tareasPorTurno.noche,
          enProgreso: 0,
          pendientes: 0
        }
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
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getRoomColor(sala.sala) }} />
                        <span className="text-sm font-medium text-gray-700">{sala.sala}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{sala.frecuencia}x</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${sala.porcentaje}%`,
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
