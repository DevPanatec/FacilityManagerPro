import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'
import { RESOURCES, ACTIONS } from './types'

// GET /api/permissions - Obtener permisos
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(permissions)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/permissions - Crear permiso
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data: permission, error } = await supabase
      .from('permissions')
      .insert([{ ...body, organization_id: organizationId }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(permission)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/permissions/[id] - Actualizar permiso
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()
    const { id, ...updateData } = body

    const { data: permission, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(permission)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/permissions/[id] - Eliminar permiso
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new Error('ID de permiso no proporcionado')
    }

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Permiso eliminado exitosamente' })
  } catch (error) {
    return handleError(error)
  }
}