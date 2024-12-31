import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/categories - Obtener categorías
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('task_categories')
      .select('*')
      .order('name', { ascending: true })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: categories, error } = await query

    if (error) throw error

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener categorías' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/categories - Crear categoría
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

    // Crear categoría
    const { data, error } = await supabase
      .from('task_categories')
      .insert([
        {
          organization_id: profile.organization_id,
          name: body.name,
          color: body.color || '#000000' // Color por defecto
        }
      ])
      .select()

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_category',
          description: `Category created: ${body.name}`
        }
      ])

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear categoría' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/categories/[id] - Actualizar categoría
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar que la categoría pertenece a la organización del usuario
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const { data, error } = await supabase
      .from('task_categories')
      .update({
        name: body.name,
        color: body.color,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('organization_id', profile.organization_id) // Asegurar que pertenece a la organización
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar categoría' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/categories/[id] - Eliminar categoría
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Verificar que la categoría pertenece a la organización del usuario
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id) // Asegurar que pertenece a la organización

    if (error) throw error

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar categoría' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 