import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/categories - Obtener categorías
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/categories - Crear categoría
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...body,
        organization_id: organizationId,
        created_by: userId
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/categories/[id] - Actualizar categoría
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/categories/[id] - Eliminar categoría
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID no proporcionado')

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 