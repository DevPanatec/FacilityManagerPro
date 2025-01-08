import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/departments - Obtener departamentos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('departments')
      .select(`
        *,
        profiles!departments_manager_id_fkey (
          first_name,
          last_name
        ),
        parent:departments!departments_parent_id_fkey (
          id,
          name
        )
      `)
      .order('name', { ascending: true })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: departments, error } = await query

    if (error) throw error

    return NextResponse.json(departments)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener departamentos' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/departments - Crear departamento
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

    // Crear departamento
    const { data, error } = await supabase
      .from('departments')
      .insert([
        {
          organization_id: profile.organization_id,
          name: body.name,
          description: body.description,
          manager_id: body.manager_id,
          parent_id: body.parent_id
        }
      ])
      .select(`
        *,
        profiles!departments_manager_id_fkey (
          first_name,
          last_name
        ),
        parent:departments!departments_parent_id_fkey (
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
          action: 'create_department',
          description: `Department created: ${body.name}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear departamento' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/departments/[id] - Actualizar departamento
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar que el departamento pertenece a la organización del usuario
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    const { data, error } = await supabase
      .from('departments')
      .update({
        name: body.name,
        description: body.description,
        manager_id: body.manager_id,
        parent_id: body.parent_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('organization_id', profile.organization_id)
      .select(`
        *,
        profiles!departments_manager_id_fkey (
          first_name,
          last_name
        ),
        parent:departments!departments_parent_id_fkey (
          id,
          name
        )
      `)

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar departamento' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/departments/[id] - Eliminar departamento
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Verificar que el departamento pertenece a la organización del usuario
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Verificar si hay empleados en el departamento
    const { data: employees } = await supabase
      .from('profiles')
      .select('id')
      .eq('department_id', id)
      .limit(1)

    if (employees && employees.length > 0) {
      throw new Error('No se puede eliminar un departamento con empleados asignados')
    }

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error

    return NextResponse.json({ message: 'Departamento eliminado exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar departamento' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 