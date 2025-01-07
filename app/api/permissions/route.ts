import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RESOURCES, ACTIONS } from './types'

// GET /api/permissions - Obtener permisos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('permissions')
      .select(`
        *,
        role:roles (
          id,
          name
        )
      `)
      .order('resource', { ascending: true })

    if (roleId) {
      query = query.eq('role_id', roleId)
    }

    const { data: permissions, error } = await query

    if (error) throw error

    return NextResponse.json(permissions)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener permisos';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/permissions - Crear permiso
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar resource y action
    if (!(body.resource in RESOURCES)) {
      throw new Error('Recurso no válido')
    }
    if (!(body.action in ACTIONS)) {
      throw new Error('Acción no válida')
    }

    // Verificar que el rol existe
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('id', body.role_id)
      .single()

    if (!role) throw new Error('Rol no encontrado')

    // Crear permiso
    const { data, error } = await supabase
      .from('permissions')
      .insert([
        {
          role_id: body.role_id,
          resource: body.resource,
          action: body.action
        }
      ])
      .select(`
        *,
        role:roles (
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
          action: 'create_permission',
          description: `Permission created: ${body.resource}:${body.action} for role ${role.id}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear permiso';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/permissions/[id] - Eliminar permiso
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el permiso existe
    const { data: permission } = await supabase
      .from('permissions')
      .select('id')
      .eq('id', id)
      .single()

    if (!permission) throw new Error('Permiso no encontrado')

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Permiso eliminado exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar permiso';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
