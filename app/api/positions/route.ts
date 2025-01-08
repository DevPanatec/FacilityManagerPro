import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/positions - Obtener posiciones
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/positions - Crear posición
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const position = await request.json()
    const { data, error } = await supabase
      .from('positions')
      .insert({
        created_by: session.user.id,
        ...position
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error creating position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/positions/[id] - Actualizar posición
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que la posición existe
    const { data: position } = await supabase
      .from('positions')
      .select('id, department_id')
      .eq('id', body.id)
      .single()

    if (!position) throw new Error('Posición no encontrada')

    // Verificar acceso al departamento
    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('id', body.department_id || position.department_id)
      .single()

    if (!department) throw new Error('Departamento no encontrado')

    const { data, error } = await supabase
      .from('positions')
      .update({
        name: body.name,
        description: body.description,
        requirements: body.requirements,
        department_id: body.department_id || position.department_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al actualizar posición'
    const statusCode = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/positions/[id] - Eliminar posición
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que la posición existe
    const { data: position } = await supabase
      .from('positions')
      .select('id')
      .eq('id', id)
      .single()

    if (!position) throw new Error('Posición no encontrada')

    // Verificar que no hay empleados asignados
    const { data: employees } = await supabase
      .from('employee_records')
      .select('id')
      .eq('position_id', id)
      .limit(1)

    if (employees && employees.length > 0) {
      throw new Error('No se puede eliminar una posición con empleados asignados')
    }

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Posición eliminada exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al eliminar posición'
    const statusCode = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
