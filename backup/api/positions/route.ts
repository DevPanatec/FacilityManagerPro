import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/positions - Obtener posiciones
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(positions)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/positions - Crear posición
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data: position, error } = await supabase
      .from('positions')
      .insert([{ ...body, organization_id: organizationId }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(position)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/positions/[id] - Actualizar posición
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()
    const { id, ...updateData } = body

    const { data: position, error } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(position)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/positions/[id] - Eliminar posición
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new Error('ID de posición no proporcionado')
    }

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Posición eliminada exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 