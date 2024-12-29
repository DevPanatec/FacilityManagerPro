import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/areas - Obtener áreas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    
    let query = supabase
      .from('areas')
      .select(`
        *,
        departments (
          id,
          name,
          organization_id
        )
      `)

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data: areas, error } = await query
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(areas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}

// POST /api/areas - Crear área
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .insert([
        {
          department_id: body.department_id,
          name: body.name,
          description: body.description
        }
      ])
      .select()

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'create_area',
          description: `Area created: ${body.name}`
        }
      ])

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear área' },
      { status: 500 }
    )
  }
}

// PUT /api/areas/[id] - Actualizar área
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .update({
        name: body.name,
        description: body.description,
        department_id: body.department_id
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar área' }, { status: 500 })
  }
}

// DELETE /api/areas/[id] - Eliminar área
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Área eliminada exitosamente' })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar área' }, { status: 500 })
  }
} 