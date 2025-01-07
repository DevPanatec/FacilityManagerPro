import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { EVALUATION_TYPE } from './types'

// GET /api/evaluations - Obtener evaluaciones
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const type = searchParams.get('type')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('evaluations')
      .select(`
        *,
        employee:employee_records!evaluations_employee_id_fkey (
          id,
          first_name,
          last_name,
          position,
          department_id
        ),
        evaluator:profiles!evaluations_evaluator_id_fkey (
          first_name,
          last_name
        )
      `)
      .order('evaluation_date', { ascending: false })

    // Aplicar filtros
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    if (type && type in EVALUATION_TYPE) {
      query = query.eq('evaluation_type', type)
    }

    const { data: evaluations, error } = await query

    if (error) throw error

    return NextResponse.json(evaluations)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener evaluaciones';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/evaluations - Crear evaluación
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar tipo
    if (!(body.evaluation_type in EVALUATION_TYPE)) {
      throw new Error('Tipo de evaluación no válido')
    }

    // Crear evaluación
    const { data, error } = await supabase
      .from('evaluations')
      .insert([
        {
          employee_id: body.employee_id,
          evaluator_id: user.id,
          evaluation_date: body.evaluation_date,
          evaluation_type: body.evaluation_type,
          scores: body.scores || {},
          comments: body.comments
        }
      ])
      .select(`
        *,
        employee:employee_records!evaluations_employee_id_fkey (
          first_name,
          last_name
        ),
        evaluator:profiles!evaluations_evaluator_id_fkey (
          first_name,
          last_name
        )
      `)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_evaluation',
          description: `Evaluation created for employee: ${body.employee_id}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear evaluación';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT /api/evaluations/[id] - Actualizar evaluación
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar tipo
    if (body.evaluation_type && !(body.evaluation_type in EVALUATION_TYPE)) {
      throw new Error('Tipo de evaluación no válido')
    }

    // Verificar que es el evaluador
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select('evaluator_id')
      .eq('id', body.id)
      .single()

    if (!evaluation || evaluation.evaluator_id !== user.id) {
      throw new Error('No autorizado para actualizar esta evaluación')
    }

    const { data, error } = await supabase
      .from('evaluations')
      .update({
        evaluation_type: body.evaluation_type,
        evaluation_date: body.evaluation_date,
        scores: body.scores,
        comments: body.comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        employee:employee_records!evaluations_employee_id_fkey (
          first_name,
          last_name
        ),
        evaluator:profiles!evaluations_evaluator_id_fkey (
          first_name,
          last_name
        )
      `)

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar evaluación';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/evaluations/[id] - Eliminar evaluación
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que es el evaluador
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select('evaluator_id')
      .eq('id', id)
      .single()

    if (!evaluation || evaluation.evaluator_id !== user.id) {
      throw new Error('No autorizado para eliminar esta evaluación')
    }

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Evaluación eliminada exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar evaluación';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
