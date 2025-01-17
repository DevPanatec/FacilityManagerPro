'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalUsers: 0,
    totalInventoryItems: 0
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener total de hospitales
        const { count: hospitalsCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })

        // Obtener total de usuarios
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // Obtener total de items en inventario
        const { count: inventoryCount } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })

        setStats({
          totalHospitals: hospitalsCount || 0,
          totalUsers: usersCount || 0,
          totalInventoryItems: inventoryCount || 0
        })
      } catch (error) {
        console.error('Error al obtener estadísticas:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel de Control Superadmin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Hospitales</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalHospitals}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Usuarios</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Items en Inventario</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalInventoryItems}</p>
          </div>
        </div>
      </div>

      {/* Aquí podemos agregar más secciones como:
          - Lista de hospitales recientes
          - Gráficos de uso del sistema
          - Alertas o notificaciones importantes */}
    </div>
  )
} 