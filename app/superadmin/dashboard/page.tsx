'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

interface Organization {
  id: string
  name: string
  type: string
  created_at: string
}

interface OrgStats {
  id: string
  name: string
  users: { count: number }[]
  inventory_items: { count: number }[]
  maintenance_requests: { count: number }[]
}

interface MaintenanceStatus {
  status: string
  count: number
}

interface InventoryOrg {
  organization_id: string
  count: number
  low_stock: number
}

interface MaintenanceOrg {
  organization_id: string
  status: string
}

interface Activity {
  id: string
  type: 'maintenance' | 'inventory' | 'user'
  description: string
  organization_id: string
  created_at: string
}

interface Task {
  id: string
  title: string
  area: string
  status: string
  created_at: string
  organization_id: string
}

interface DashboardStats {
  totalOrganizations: number
  totalUsers: number
  totalInventoryItems: number
  totalMaintenanceRequests: number
  organizationsWithLowStock: number
  pendingMaintenanceCount: number
  maintenanceByStatus: {
    status: string
    count: number
  }[]
  inventoryByOrganization: {
    organization: string
    itemCount: number
    lowStockCount: number
  }[]
  maintenanceByOrganization: {
    organization: string
    completed: number
    pending: number
  }[]
  recentActivities: {
    id: string
    type: 'maintenance' | 'inventory' | 'user'
    description: string
    organization: string
    timestamp: string
  }[]
  taskStats: {
    totalTasks: number
    activeTasks: number
    completedTasks: number
    tasksByArea: {
      area: string
      count: number
      status: 'active' | 'completed'
    }[]
    tasksTrend: {
      date: string
      count: number
    }[]
  }
  tasksByPeriod: {
    daily: {
      tasks: any[]
      total: number
    }
    weekly: {
      tasks: any[]
      total: number
    }
    monthly: {
      tasks: any[]
      total: number
    }
  }
}

export default function SuperAdminDashboard() {
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalInventoryItems: 0,
    totalMaintenanceRequests: 0,
    organizationsWithLowStock: 0,
    pendingMaintenanceCount: 0,
    maintenanceByStatus: [],
    inventoryByOrganization: [],
    maintenanceByOrganization: [],
    recentActivities: [],
    taskStats: {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      tasksByArea: [],
      tasksTrend: []
    },
    tasksByPeriod: {
      daily: {
        tasks: [],
        total: 0
      },
      weekly: {
        tasks: [],
        total: 0
      },
      monthly: {
        tasks: [],
        total: 0
      }
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadStats()
  }, [selectedOrganization])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar que el usuario sea superadmin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || userData.role !== 'superadmin') {
        throw new Error('Acceso denegado: Se requieren permisos de superadmin')
      }

      // Cargar organizaciones
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (orgsError) throw orgsError
      setOrganizations(orgs || [])

    } catch (error) {
      console.error('Error loading initial data:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar datos iniciales')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calcular fechas del período seleccionado
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      // Obtener la fecha de inicio según el período seleccionado
      const periodStart = selectedPeriod === 'daily' ? today :
                         selectedPeriod === 'weekly' ? weekStart : monthStart

      // Consulta base para estadísticas de la organización
      let orgStatsQuery = supabase
        .from('organizations')
        .select(`
          id,
          name,
          users (count),
          inventory_items (count),
          maintenance_requests (count)
        `)
        .gte('created_at', periodStart.toISOString())

      if (selectedOrganization !== 'all') {
        orgStatsQuery = orgStatsQuery.eq('id', selectedOrganization)
      }

      const { data: orgStats } = await orgStatsQuery as { data: OrgStats[] }

      // Obtener estado de mantenimientos
      let maintenanceQuery = supabase
        .from('maintenance_requests')
        .select('status')
        .gte('created_at', periodStart.toISOString())

      if (selectedOrganization !== 'all') {
        maintenanceQuery = maintenanceQuery.eq('organization_id', selectedOrganization)
      }

      const { data: maintenanceStatus } = await maintenanceQuery

      // Agrupar por estado
      const maintenanceByStatus = maintenanceStatus?.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      }, {})

      // Obtener items con bajo stock
      let inventoryQuery = supabase
        .from('inventory_items')
        .select('*')
        .lt('quantity', supabase.rpc('get_minimum_quantity'))

      if (selectedOrganization !== 'all') {
        inventoryQuery = inventoryQuery.eq('organization_id', selectedOrganization)
      }

      const { data: lowStock } = await inventoryQuery

      // Obtener actividades recientes
      let activitiesQuery = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (selectedOrganization !== 'all') {
        activitiesQuery = activitiesQuery.eq('organization_id', selectedOrganization)
      }

      const { data: activities } = await activitiesQuery

      // Obtener tareas
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .gte('created_at', periodStart.toISOString())

      if (selectedOrganization !== 'all') {
        tasksQuery = tasksQuery.eq('organization_id', selectedOrganization)
      }

      const { data: tasks } = await tasksQuery

      // Procesar estadísticas
      const stats: DashboardStats = {
        totalOrganizations: selectedOrganization === 'all' ? organizations.length : 1,
        totalUsers: selectedOrganization === 'all' 
          ? orgStats?.reduce((sum, org) => sum + (org.users?.[0]?.count || 0), 0) || 0
          : orgStats?.[0]?.users?.[0]?.count || 0,
        totalInventoryItems: selectedOrganization === 'all'
          ? orgStats?.reduce((sum, org) => sum + (org.inventory_items?.[0]?.count || 0), 0) || 0
          : orgStats?.[0]?.inventory_items?.[0]?.count || 0,
        totalMaintenanceRequests: selectedOrganization === 'all'
          ? orgStats?.reduce((sum, org) => sum + (org.maintenance_requests?.[0]?.count || 0), 0) || 0
          : orgStats?.[0]?.maintenance_requests?.[0]?.count || 0,
        organizationsWithLowStock: lowStock?.length || 0,
        pendingMaintenanceCount: maintenanceStatus?.filter(m => m.status === 'pending').length || 0,
        maintenanceByStatus: Object.entries(maintenanceByStatus || {}).map(([status, count]) => ({
          status,
          count
        })),
        inventoryByOrganization: [],
        maintenanceByOrganization: [],
        recentActivities: (activities || []).map(activity => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          organization: activity.organization_id,
          timestamp: activity.created_at
        })),
        taskStats: {
          totalTasks: tasks?.length || 0,
          activeTasks: tasks?.filter(t => t.status === 'active').length || 0,
          completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
          tasksByArea: Object.entries(
            (tasks || []).reduce((acc: { [key: string]: { active: number, completed: number } }, task) => {
              if (!acc[task.area]) {
                acc[task.area] = { active: 0, completed: 0 }
              }
              if (task.status === 'active') acc[task.area].active++
              if (task.status === 'completed') acc[task.area].completed++
              return acc
            }, {})
          ).map(([area, counts]: [string, { active: number, completed: number }]) => ({
            area,
            count: counts.active + counts.completed,
            status: counts.active > counts.completed ? 'active' : 'completed'
          })),
          tasksTrend: []
        },
        tasksByPeriod: {
          daily: {
            tasks: tasks?.filter(task => 
              new Date(task.created_at).toDateString() === new Date().toDateString()
            ) || [],
            total: tasks?.filter(task => 
              new Date(task.created_at).toDateString() === new Date().toDateString()
            ).length || 0
          },
          weekly: {
            tasks: tasks?.filter(task => 
              new Date(task.created_at) >= weekStart
            ) || [],
            total: tasks?.filter(task => 
              new Date(task.created_at) >= weekStart
            ).length || 0
          },
          monthly: {
            tasks: tasks || [],
            total: tasks?.length || 0
          }
        }
      }

      // Calcular tendencia de tareas
      const trendDays = selectedPeriod === 'daily' ? 24 : // Horas del día
                       selectedPeriod === 'weekly' ? 7 : // Días de la semana
                       30 // Días del mes

      const trendData = [...Array(trendDays)].map((_, i) => {
        const date = new Date(periodStart)
        if (selectedPeriod === 'daily') {
          date.setHours(date.getHours() + i)
        } else {
          date.setDate(date.getDate() + i)
        }
        return date.toISOString()
      })

      stats.taskStats.tasksTrend = trendData.map(date => ({
        date,
        count: tasks?.filter(task => {
          const taskDate = new Date(task.created_at)
          return selectedPeriod === 'daily' ?
            taskDate.getHours() === new Date(date).getHours() :
            taskDate.toDateString() === new Date(date).toDateString()
        }).length || 0
      }))

      setStats(prevStats => ({
        ...prevStats,
        ...stats
      }))

    } catch (error) {
      console.error('Error loading stats:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadInitialData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard SuperAdmin</h1>
            <div className="flex items-center gap-4">
              {/* Filtro de Período */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedPeriod('daily')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === 'daily'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Día
                </button>
                <button
                  onClick={() => setSelectedPeriod('weekly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === 'weekly'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPeriod === 'monthly'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Mes
                </button>
              </div>
              {/* Selector de Organización */}
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="block w-64 pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg
                         bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todas las organizaciones</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas de Tareas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tareas Totales</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.taskStats?.totalTasks || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tareas Activas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.taskStats?.activeTasks || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tareas Completadas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.taskStats?.completedTasks || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos de Tareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Distribución por Área */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Distribución por Área</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.taskStats?.tasksByArea.map((area, index) => (
                  <div key={index} className="hover:bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{area.area}</span>
                      <span className={`text-sm font-medium ${
                        area.status === 'active' ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {area.count} tareas
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          area.status === 'active' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(area.count / stats.taskStats.totalTasks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tendencia de Tareas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tendencia de Tareas</h3>
            </div>
            <div className="p-6">
              <div className="relative h-64">
                {stats.taskStats?.tasksTrend.map((day, index) => (
                  <div
                    key={index}
                    className="absolute bottom-0 bg-blue-500 rounded-t-lg transition-all duration-300"
                    style={{
                      left: `${(index / 7) * 100}%`,
                      width: '12%',
                      height: `${(day.count / Math.max(...stats.taskStats.tasksTrend.map(d => d.count))) * 100}%`
                    }}
                  >
                    <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs text-gray-600">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                {stats.taskStats?.tasksTrend.map((day, index) => (
                  <span key={index} className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Organizaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {selectedOrganization === 'all' ? 'Total Organizaciones' : 'Organización Seleccionada'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {selectedOrganization === 'all' ? stats.totalOrganizations : 1}
                </p>
              </div>
            </div>
          </div>

          {/* Total Usuarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          {/* Items en Inventario */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Items en Inventario</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalInventoryItems}</p>
              </div>
            </div>
          </div>

          {/* Mantenimientos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m14-10v.01M17 21h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2v6zM5 21h2v-6H5a2 2 0 00-2 2v2a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mantenimientos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMaintenanceRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nueva sección de Tareas por Período */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tareas del Período</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Total de tareas: {stats.tasksByPeriod?.[selectedPeriod].total || 0}
              </p>
            </div>
            <div className="space-y-4">
              {stats.tasksByPeriod?.[selectedPeriod].tasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'active' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title || 'Sin título'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-sm text-gray-500">{task.area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráficos y Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventario por Organización */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Inventario por Organización</h3>
                </div>
                <span className="text-sm text-red-500">{stats.organizationsWithLowStock} con stock bajo</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.inventoryByOrganization?.map((org, index) => (
                  <div key={index} className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{org.organization}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{org.itemCount} items</p>
                        <p className="text-xs text-red-500">{org.lowStockCount} en stock bajo</p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(org.itemCount / Math.max(...stats.inventoryByOrganization.map(o => o.itemCount))) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mantenimientos por Organización */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Mantenimientos por Organización</h3>
                </div>
                <span className="text-sm text-yellow-500">{stats.pendingMaintenanceCount} pendientes</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.maintenanceByOrganization?.map((org, index) => (
                  <div key={index} className="hover:bg-gray-50 p-3 rounded-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{org.organization}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">{org.completed}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">{org.pending}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(org.completed / (org.completed + org.pending)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${(org.pending / (org.completed + org.pending)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estado de Mantenimientos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Estado de Mantenimientos</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {stats.maintenanceByStatus?.map((status, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{status.status}</span>
                      <span className="text-lg font-semibold text-gray-900">{status.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status.status === 'Completado' ? 'bg-green-500' :
                          status.status === 'Pendiente' ? 'bg-yellow-500' :
                          status.status === 'En Progreso' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(status.count / stats.totalMaintenanceRequests) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actividades Recientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Actividades Recientes</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {stats.recentActivities?.map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-full ${
                      activity.type === 'maintenance' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'inventory' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {activity.type === 'maintenance' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                        )}
                        {activity.type === 'inventory' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        )}
                        {activity.type === 'user' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.organization}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 