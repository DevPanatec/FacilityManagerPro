import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/dashboard - Obtener datos del dashboard
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, year
    
    // Obtener el usuario y su organización
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

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
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Obtener datos analíticos
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics_data')
      .select(`
        id,
        data_type,
        data_value,
        period_start,
        period_end
      `)
      .eq('organization_id', profile.organization_id)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .lte('period_end', now.toISOString().split('T')[0])
      .order('period_start', { ascending: false })

    if (analyticsError) throw analyticsError

    // Obtener métricas de rendimiento
    const { data: performanceData, error: performanceError } = await supabase
      .from('performance_metrics')
      .select(`
        id,
        metric_type,
        metric_value,
        measured_at
      `)
      .eq('organization_id', profile.organization_id)
      .gte('measured_at', startDate.toISOString())
      .lte('measured_at', now.toISOString())
      .order('measured_at', { ascending: false })

    if (performanceError) throw performanceError

    // Estructurar respuesta
    const dashboardData = {
      analytics: {
        data: analyticsData,
        period: period,
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
      performance: {
        metrics: performanceData,
        lastUpdated: performanceData[0]?.measured_at || null
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener datos del dashboard';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/dashboard/analytics - Registrar datos analíticos
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario y su organización
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Registrar datos analíticos
    const { data, error } = await supabase
      .from('analytics_data')
      .insert([
        {
          organization_id: profile.organization_id,
          data_type: body.data_type,
          data_value: body.data_value,
          period_start: body.period_start,
          period_end: body.period_end || new Date().toISOString().split('T')[0]
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar datos del dashboard';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
