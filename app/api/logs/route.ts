import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/logs - Obtener logs de actividad/auditoría
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'activity' // activity o audit
    const organizationId = searchParams.get('organizationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Obtener el usuario y su organización
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Seleccionar tabla según tipo
    const table = type === 'audit' ? 'audit_logs' : 'activity_logs'
    
    // Construir query
    let query = supabase
      .from(table)
      .select(`
        *,
        profiles!${table}_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por organización si se especifica
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: logs, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      logs,
      pagination: {
        total: count,
        offset,
        limit
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener logs' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/logs - Registrar nuevo log
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Determinar tabla según tipo
    const table = body.type === 'audit' ? 'audit_logs' : 'activity_logs'

    // Registrar log
    const { data, error } = await supabase
      .from(table)
      .insert([
        {
          organization_id: profile.organization_id,
          user_id: user.id,
          action: body.action,
          description: body.description,
          metadata: body.metadata || {},
          ip_address: body.ip_address,
          user_agent: body.user_agent
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar log' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 