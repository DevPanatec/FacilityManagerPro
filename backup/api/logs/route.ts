import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/logs - Obtener logs con filtros mejorados
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtrado
    const type = searchParams.get('type') || 'system'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    
    let query = supabase
      .from(type === 'security' ? 'security_logs' : 'system_audit_logs')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/logs - Registrar nuevo log con validación mejorada
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Validar campos requeridos
    if (!body.action || !body.description) {
      throw new Error('Se requieren los campos action y description')
    }

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const logEntry = {
      ...body,
      user_id: user.id,
      metadata: {
        ...body.metadata,
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logEntry])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 400 }
    )
  }
} 