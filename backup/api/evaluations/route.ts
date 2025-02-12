import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'
import { EVALUATION_TYPE } from './types'

// GET /api/evaluations - Obtener evaluaciones
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('evaluations')
      .select(`
        *,
        evaluator:evaluator_id(
          id,
          first_name,
          last_name
        ),
        evaluated:user_id(
          id,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/evaluations - Crear evaluación
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('evaluations')
      .insert([{
        ...body,
        evaluator_id: userId,
        organization_id: organizationId
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/evaluations/[id] - Actualizar evaluación
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('evaluations')
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

// DELETE /api/evaluations/[id] - Eliminar evaluación
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID no proporcionado')

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Evaluación eliminada exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 