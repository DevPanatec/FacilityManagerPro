'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { taskService } from '@/app/services/taskService';

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

      // Cargar tareas usando el servicio compartido
      const taskData = await taskService.loadAllTasks();
      console.log('Datos de tareas (usando servicio compartido):', taskData);

      // Obtener usuarios asociados a las tareas
      const userIds = taskData
        .filter(task => task.assigned_to)
        .map(task => task.assigned_to);

      // Si la consulta básica funciona, obtener los usuarios asignados
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name
        `)
        .in('id', userIds.filter(Boolean));

      if (usersError) {
        console.error('Error al obtener usuarios:', usersError);
        throw new Error('Error al obtener usuarios: ' + usersError.message);
      }

      // Crear un mapa de usuarios para fácil acceso
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Combinar los datos de tareas con los usuarios
      const tasksWithUsers = taskData.map(task => ({
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

      // Obtener datos del inventario
      let { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', userProfile.organization_id);

      if (inventoryError) {
        console.error('Error al obtener inventario:', inventoryError);
        throw new Error('Error al obtener inventario: ' + inventoryError.message);
      }

      console.log('Inventario completo obtenido:', inventoryData);

      // Filtrar en JavaScript los elementos con cantidad menor al stock mínimo o con estado "out_of_stock"
      inventoryData = (inventoryData || []).filter(item => {
        const quantity = Number(item.quantity);
        const minStock = Number(item.min_stock);
        const isLowStock = quantity <= minStock;
        const isOutOfStock = item.status === 'out_of_stock';
        
        console.log(`Item ${item.name}: cantidad=${quantity}, min_stock=${minStock}, bajo_stock=${isLowStock}, out_of_stock=${isOutOfStock}`);
        
        return isLowStock || isOutOfStock;
      });

      // Debug: Mostrar todos los items del inventario filtrados
      console.log('Datos de inventario filtrados:', inventoryData);

      // Formatear alertas de inventario
      const formattedAlerts = (inventoryData || [])
        .map(item => {
          // Asegurarse de que los valores sean números
          const quantity = Number(item.quantity);
          const minStock = Number(item.min_stock);
          
          // Debug: Mostrar valores convertidos
          console.log('Procesando item:', {
            name: item.name,
            quantity,
            minStock,
            difference: minStock - quantity,
            status: item.status
          });

          return {
            producto: item.name,
            stockActual: quantity,
            stockMinimo: minStock,
            itemsNecesarios: Math.max(0, minStock - quantity)
          };
        });

      // Debug: Mostrar alertas finales
      console.log('Alertas formateadas:', formattedAlerts);

      // Actualizar el estado
      setDashboardData(prevData => ({
        ...prevData,
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
      }));

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
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#4263eb] border-opacity-20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#4263eb] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-[10px] text-[#4263eb] font-medium">Cargando</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="p-2 rounded-full bg-red-100 mb-3 animate-pulse">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-500 mb-4 font-medium">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="px-6 py-2 bg-gradient-to-r from-[#4263eb] to-[#364fc7] text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4263eb] to-[#5a7af2] -mx-4 sm:-mx-6 mt-2 px-6 py-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
              <p className="text-sm text-blue-100">Resumen general del sistema</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto bg-white bg-opacity-10 p-1 rounded-full">
            <button 
              onClick={() => setSelectedPeriod('dia')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                selectedPeriod === 'dia' 
                  ? 'bg-white text-[#4263eb] shadow-md' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Día
            </button>
            <button 
              onClick={() => setSelectedPeriod('semana')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                selectedPeriod === 'semana' 
                  ? 'bg-white text-[#4263eb] shadow-md' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Semana
            </button>
            <button 
              onClick={() => setSelectedPeriod('mes')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                selectedPeriod === 'mes' 
                  ? 'bg-white text-[#4263eb] shadow-md' 
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Asignaciones Pendientes */}
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Asignaciones Pendientes</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{dashboardData.asignacionesPendientes.cantidad}</p>
                <p className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  +{dashboardData.asignacionesPendientes.variacion}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Activo */}
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Personal Activo</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{dashboardData.personalActivo}</p>
                <p className="ml-2 text-xs text-gray-500">En turno</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{dashboardData.tiempoPromedio}</p>
                <p className="ml-2 text-xs text-gray-500">Por tarea</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eficiencia Global */}
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Eficiencia Global</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{dashboardData.eficienciaGlobal}%</p>
                <div className="ml-2 h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: `${dashboardData.eficienciaGlobal}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productividad por Turno */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-shadow duration-300 hover:shadow-md">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Productividad por Turno</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Turno Mañana */}
            <div className="hover:bg-blue-50 p-4 rounded-lg transition-all duration-300 group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Mañana</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded-full group-hover:bg-blue-100 transition-colors duration-300">{dashboardData.productividadTurno.manana} tareas</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.manana / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700"
                />
              </div>
            </div>

            {/* Turno Tarde */}
            <div className="hover:bg-orange-50 p-4 rounded-lg transition-all duration-300 group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Tarde</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 bg-orange-50 px-2 py-1 rounded-full group-hover:bg-orange-100 transition-colors duration-300">{dashboardData.productividadTurno.tarde} tareas</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.tarde / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-400 to-orange-600 group-hover:from-orange-500 group-hover:to-orange-700"
                />
              </div>
            </div>

            {/* Turno Noche */}
            <div className="hover:bg-indigo-50 p-4 rounded-lg transition-all duration-300 group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Noche</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 bg-indigo-50 px-2 py-1 rounded-full group-hover:bg-indigo-100 transition-colors duration-300">{dashboardData.productividadTurno.noche} tareas</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ 
                    width: `${(dashboardData.productividadTurno.noche / 45) * 100}%`
                  }}
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-400 to-indigo-600 group-hover:from-indigo-500 group-hover:to-indigo-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alertas de Inventario */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-shadow duration-300 hover:shadow-md">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-lg font-bold text-gray-900">Alertas de Inventario</h3>
                <span className="text-sm text-white font-medium bg-red-500 px-2 py-1 rounded-full animate-pulse">{dashboardData.alertasInventario.length} items</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col h-[350px]">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {dashboardData.alertasInventario.length > 0 ? (
                  dashboardData.alertasInventario.map((item, index) => (
                    <div key={index} className="space-y-2 hover:bg-gray-50 p-4 rounded-lg transition-all duration-300 border border-gray-100 group hover:border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 ${item.stockActual === 0 ? 'bg-red-500' : 'bg-yellow-500'} rounded-full group-hover:animate-pulse`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.producto}</p>
                            <p className="text-xs text-gray-500">{item.itemsNecesarios} items necesitan reposición</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">Stock: {item.stockActual}</p>
                          <p className={`text-[11px] font-medium ${item.stockActual === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                            Mínimo: {item.stockMinimo}
                          </p>
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              item.stockActual === 0 
                                ? 'bg-gradient-to-r from-red-400 to-red-600 group-hover:from-red-500 group-hover:to-red-700' 
                                : 'bg-gradient-to-r from-yellow-400 to-yellow-600 group-hover:from-yellow-500 group-hover:to-yellow-700'
                            }`}
                            style={{ width: `${Math.min((item.stockActual / item.stockMinimo) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No hay items con stock bajo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Asignaciones */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-shadow duration-300 hover:shadow-md">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Estado de Asignaciones</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="relative h-64">
              <div className="flex justify-between items-end h-full">
                {dashboardData.estadoAsignaciones.map((dia, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 w-1/6 relative group">
                    <div className="w-full flex flex-col gap-1 transform transition-transform duration-300 group-hover:scale-105">
                      <div 
                        className="bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-lg transition-all duration-500 shadow-sm" 
                        style={{ 
                          height: `${Math.min(
                            Math.max((dia.completadas / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                            150
                          )}px` 
                        }} 
                      />
                      <div 
                        className="bg-gradient-to-t from-red-400 to-red-600 rounded-b-lg transition-all duration-500 shadow-sm" 
                        style={{ 
                          height: `${Math.min(
                            Math.max((dia.pendientes / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                            150
                          )}px` 
                        }} 
                      />
                      {dia.enProgreso > 0 && (
                        <div 
                          className="bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-b-lg transition-all duration-500 shadow-sm" 
                          style={{ 
                            height: `${Math.min(
                              Math.max((dia.enProgreso / (dia.completadas + dia.pendientes + dia.enProgreso || 1)) * 150, 4),
                              150
                            )}px` 
                          }} 
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-gray-200 transition-all duration-300">{dia.dia}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-white p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10">
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-blue-600 font-medium">Completadas: {dia.completadas}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-600 font-medium">Pendientes: {dia.pendientes}</span>
                        </p>
                        {dia.enProgreso > 0 && (
                          <p className="text-sm flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-yellow-600 font-medium">En Progreso: {dia.enProgreso}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-blue-600 font-medium">Completadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-600 font-medium">Pendientes</span>
                </div>
                {dashboardData.estadoAsignaciones.some(dia => dia.enProgreso > 0) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-yellow-600 font-medium">En Progreso</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Frecuencia de Limpieza */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-shadow duration-300 hover:shadow-md">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Frecuencia de Limpieza por Sala</h3>
            </div>
          </div>
          <div className="h-[350px] overflow-y-auto">
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.frecuenciaLimpieza.map((sala, index) => (
                  <div key={index} className="hover:bg-gray-50 p-4 rounded-lg transition-all duration-300 border border-gray-100 group hover:border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" 
                          style={{ backgroundColor: getRoomColor(sala.sala) }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{sala.sala}</span>
                      </div>
                      <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-full ml-2 flex-shrink-0 group-hover:bg-gray-200 transition-colors duration-300">{sala.frecuencia}x</span>
                    </div>
                    <div className="relative pt-1 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Progreso</span>
                        <span className="text-xs font-medium" style={{ color: getRoomColor(sala.sala) }}>{sala.porcentaje}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 shadow-inner"
                          style={{ 
                            width: `${Math.min(sala.porcentaje, 100)}%`,
                            background: `linear-gradient(to right, ${getRoomColor(sala.sala)}99, ${getRoomColor(sala.sala)})`
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
