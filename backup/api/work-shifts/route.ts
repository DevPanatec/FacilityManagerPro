import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/work-shifts - Obtener turnos
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('No autorizado')
    if (!user) throw new Error('No autorizado')

    // Obtener turnos
    const { data: shifts, error: shiftsError } = await supabase
      .from('work_shifts')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('date', { ascending: false })

    if (shiftsError) throw shiftsError

    return NextResponse.json(shifts || [])
  } catch (error) {
    console.error('Error en GET /work-shifts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener turnos' },
      { status: error instanceof Error && error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/work-shifts - Crear turno
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('No autorizado')
    if (!user) throw new Error('No autorizado')

    // Obtener datos del body
    const body = await request.json()

    // Insertar turno
    const { data, error: insertError } = await supabase
      .from('work_shifts')
      .insert([{
        ...body,
        user_id: user.id
      }])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en POST /work-shifts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear turno' },
      { status: error instanceof Error && error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/work-shifts/[id] - Actualizar turno
export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('No autorizado')
    if (!user) throw new Error('No autorizado')

    // Obtener datos del body
    const body = await request.json()
    const { id, ...updateData } = body

    // Actualizar turno
    const { data, error: updateError } = await supabase
      .from('work_shifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en PUT /work-shifts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar turno' },
      { status: error instanceof Error && error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/work-shifts/[id] - Eliminar turno
export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('No autorizado')
    if (!user) throw new Error('No autorizado')

    // Obtener ID del turno
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new Error('ID de turno no proporcionado')

    // Eliminar turno
    const { error: deleteError } = await supabase
      .from('work_shifts')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /work-shifts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar turno' },
      { status: error instanceof Error && error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 