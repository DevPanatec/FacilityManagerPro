import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RESOURCES, ACTIONS } from '../../lib/types/permissions'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    // Verificar permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        *,
        permissions (
          id,
          resource,
          action,
          conditions
        ),
        child_roles:role_hierarchy!parent_role_id (
          child:roles (
            id,
            name
          )
        )
      `)
      .eq('organization_id', organizationId)
      .order('name')

    if (error) throw error

    return NextResponse.json(roles)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener roles' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Crear rol
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert([{
        name: body.name,
        description: body.description,
        organization_id: body.organization_id
      }])
      .select()
      .single()

    if (roleError) throw roleError

    // Crear permisos
    if (body.permissions?.length) {
      const { error: permError } = await supabase
        .from('permissions')
        .insert(
          body.permissions.map((p: any) => ({
            role_id: role.id,
            resource: p.resource,
            action: p.action,
            conditions: p.conditions,
            organization_id: body.organization_id
          }))
        )

      if (permError) throw permError
    }

    return NextResponse.json(role)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear rol' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 