import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/positions - Obtener posiciones
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('positions')
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)
      .order('name', { ascending: true })

    // Aplicar filtros
    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: positions, error } = await query

    if (error) throw error

    return NextResponse.json(positions)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al obtener posiciones'
    const statusCode = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/positions - Crear posición
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el departamento existe y el usuario tiene acceso
    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('id', body.department_id)
      .single()

    if (!department) throw new Error('Departamento no encontrado')

    // Crear posición
    const { data, error } = await supabase
      .from('positions')
      .insert([
        {
          department_id: body.department_id,
          name: body.name,
          description: body.description,
          requirements: body.requirements
        }
      ])
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_position',
          description: `Position created: ${body.name}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al crear posición'
    const statusCode = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT /api/positions/[id] - Actualizar posición
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
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
    const supabase = createRouteHandlerClient({ cookies })
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
