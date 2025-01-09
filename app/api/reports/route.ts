import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET reports with optional filters
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('reports')
      .select(`
        id,
        title,
        description,
        type,
        data,
        created_by,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros si existen
    const type = searchParams.get('type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    if (type) query = query.eq('type', type)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST new report
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Crear reporte
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        title: body.title,
        description: body.description,
        type: body.type,
        data: body.data,
        created_by: user.id
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 