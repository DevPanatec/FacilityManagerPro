import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { cache } from 'react'

export const dynamic = 'force-dynamic'
const CACHE_TIME = 5 * 60 * 1000 // 5 minutos

// Función para obtener datos con caché
const getCachedData = cache(async (supabase: any, key: string) => {
  const cacheKey = `dashboard_${key}`
  const cachedData = await supabase
    .from('cache')
    .select('data, updated_at')
    .eq('key', cacheKey)
    .single()

  if (cachedData?.data && Date.now() - new Date(cachedData.updated_at).getTime() < CACHE_TIME) {
    return cachedData.data
  }
  return null
})

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Obtener perfil y organización
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Calcular fechas según el periodo
    const now = new Date()
    const startDate = new Date()
    switch(period) {
      case 'week': startDate.setDate(now.getDate() - 7); break
      case 'month': startDate.setMonth(now.getMonth() - 1); break
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break
    }

    // Intentar obtener datos cacheados
    const cachedStats = await getCachedData(supabase, `stats_${period}`)
    if (cachedStats) {
      return NextResponse.json(cachedStats)
    }

    // Obtener estadísticas básicas
    const [
      { count: usersCount },
      { count: tasksCount },
      { count: reportsCount },
      { count: attendanceCount }
    ] = await Promise.all([
      supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id),
      supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString()),
      supabase.from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString()),
      supabase.from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', new Date().toISOString().split('T')[0])
    ])

    // Obtener datos analíticos
    const { data: analyticsData } = await supabase
      .from('analytics_data')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: false })

    // Obtener actividad reciente
    const [recentTasks, recentReports] = await Promise.all([
      supabase.from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          assigned_to,
          due_date
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('reports')
        .select(`
          id,
          title,
          type,
          created_by,
          created_at
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const dashboardData = {
      stats: {
        users: usersCount || 0,
        tasks: tasksCount || 0,
        reports: reportsCount || 0,
        attendance: attendanceCount || 0
      },
      analytics: {
        data: analyticsData,
        period,
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
      recentActivity: {
        tasks: recentTasks.data || [],
        reports: recentReports.data || []
      }
    }

    // Guardar en caché
    await supabase
      .from('cache')
      .upsert({
        key: `dashboard_stats_${period}`,
        data: dashboardData,
        updated_at: new Date().toISOString()
      })

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 