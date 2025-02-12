import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/dashboard - Obtener datos del dashboard
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    // Obtener estadísticas de tareas
    const { data: taskStats, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('organization_id', organizationId)

    if (taskError) throw taskError

    const taskStatusCount = taskStats.reduce((acc: { [key: string]: number }, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {})

    // Obtener estadísticas de áreas
    const { data: areaStats, error: areaError } = await supabase
      .from('areas')
      .select('*')
      .eq('organization_id', organizationId)

    if (areaError) throw areaError

    // Obtener estadísticas de equipos
    const { data: equipmentStats, error: equipmentError } = await supabase
      .from('equipment')
      .select('status')
      .eq('organization_id', organizationId)

    if (equipmentError) throw equipmentError

    const equipmentStatusCount = equipmentStats.reduce((acc: { [key: string]: number }, equipment) => {
      acc[equipment.status] = (acc[equipment.status] || 0) + 1
      return acc
    }, {})

    // Obtener últimas actividades
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (activitiesError) throw activitiesError

    return NextResponse.json({
      taskStats: {
        total: taskStats.length,
        byStatus: taskStatusCount
      },
      areaStats: {
        total: areaStats.length
      },
      equipmentStats: {
        total: equipmentStats.length,
        byStatus: equipmentStatusCount
      },
      recentActivities
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/dashboard/analytics - Registrar datos analíticos
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('analytics_data')
      .insert([{
        ...body,
        user_id: userId,
        organization_id: organizationId
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
} 