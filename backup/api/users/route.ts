import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/users - Obtener usuarios
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    let query = supabase
      .from('users')
      .select(`
        *,
        roles (
          id,
          name,
          permissions
        )
      `)
      .order('created_at', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: users, error } = await query

    if (error) throw error

    return NextResponse.json(users)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener usuarios'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// PUT /api/users - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID de usuario requerido')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // No permitir eliminar el propio usuario
    if (id === user.id) {
      throw new Error('No puedes eliminar tu propio usuario')
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
} 