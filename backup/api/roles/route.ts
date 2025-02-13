import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RESOURCES, ACTIONS } from '../../../lib/types/permissions'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')

    if (error) throw error

    return NextResponse.json(roles)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al obtener roles' },
        { status: error.message.includes('No autorizado') ? 403 : 500 }
      )
    }
    return NextResponse.json(
      { error: 'Error al obtener roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar permisos
    const permissions = body.permissions || []
    const validPermissions = permissions.every((p: any) => 
      RESOURCES[p.resource as keyof typeof RESOURCES] &&
      ACTIONS[p.action as keyof typeof ACTIONS]
    )

    if (!validPermissions) {
      throw new Error('Permisos inválidos')
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al crear rol' },
        { status: error.message.includes('No autorizado') ? 403 : 500 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear rol' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el rol existe
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('id', id)
      .single()

    if (!role) throw new Error('Rol no encontrado')

    const { data, error } = await supabase
      .from('roles')
      .update({
        name: body.name,
        description: body.description
      })
      .eq('id', id)
      .select()

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'update_role',
          description: `Role updated: ${id}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al actualizar rol' },
        { status: error.message.includes('No autorizado') ? 403 : 500 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar rol' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el rol existe
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('id', id)
      .single()

    if (!role) throw new Error('Rol no encontrado')

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'delete_role',
          description: `Role deleted: ${id}`
        }
      ])

    return NextResponse.json({ message: 'Rol eliminado exitosamente' })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al eliminar rol' },
        { status: error.message.includes('No autorizado') ? 403 : 500 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar rol' },
      { status: 500 }
    )
  }
} 