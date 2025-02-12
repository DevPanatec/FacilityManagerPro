import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/attendance - Obtener registros de asistencia
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/attendance - Registrar asistencia
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        ...body,
        user_id: userId,
        organization_id: organizationId
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/attendance/[id] - Actualizar registro de asistencia (check-out)
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('attendance')
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

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID no proporcionado')

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Registro eliminado exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 