import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { TIME_OFF_STATUS, TIME_OFF_TYPE } from './types'

// GET /api/time-off - Obtener solicitudes
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')

    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        users!time_off_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: requests, error } = await query

    if (error) throw error

    return NextResponse.json(requests)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener solicitudes'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// POST /api/time-off - Crear solicitud
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([{
        ...body,
        user_id: user.id,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear solicitud'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// PUT /api/time-off/[id] - Actualizar solicitud (aprobar/rechazar)
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('time_off_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar solicitud'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// DELETE /api/time-off/[id] - Cancelar solicitud
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID de solicitud requerido')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar solicitud'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
} 