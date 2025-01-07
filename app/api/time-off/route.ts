import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { TIME_OFF_STATUS, TIME_OFF_TYPE } from './types'

// GET /api/time-off - Obtener solicitudes
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employee_records!time_off_requests_employee_id_fkey (
          id,
          first_name,
          last_name,
          department_id
        )
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    if (status && status in TIME_OFF_STATUS) {
      query = query.eq('status', status)
    }
    if (type && type in TIME_OFF_TYPE) {
      query = query.eq('request_type', type)
    }

    const { data: requests, error } = await query

    if (error) throw error

    return NextResponse.json(requests)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al obtener solicitudes'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// POST /api/time-off - Crear solicitud
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar tipo
    if (!(body.request_type in TIME_OFF_TYPE)) {
      throw new Error('Tipo de ausencia no válido')
    }

    // Obtener employee_id del usuario
    const { data: employee } = await supabase
      .from('employee_records')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!employee) throw new Error('Empleado no encontrado')

    // Crear solicitud
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([
        {
          employee_id: employee.id,
          request_type: body.request_type,
          status: TIME_OFF_STATUS.PENDING,
          start_date: body.start_date,
          end_date: body.end_date,
          notes: body.notes
        }
      ])
      .select(`
        *,
        employee:employee_records!time_off_requests_employee_id_fkey (
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
          action: 'create_time_off_request',
          description: `Time off request created: ${body.request_type}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al crear solicitud'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// PUT /api/time-off/[id] - Actualizar solicitud (aprobar/rechazar)
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que la solicitud existe
    const { data: timeOff } = await supabase
      .from('time_off_requests')
      .select('id, status, employee_id')
      .eq('id', body.id)
      .single()

    if (!timeOff) throw new Error('Solicitud no encontrada')

    // Validar nuevo status
    if (!(body.status in TIME_OFF_STATUS)) {
      throw new Error('Estado no válido')
    }

    // Solo permitir aprobar/rechazar si está pendiente
    if (timeOff.status !== TIME_OFF_STATUS.PENDING) {
      throw new Error('Solo se pueden aprobar/rechazar solicitudes pendientes')
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .update({
        status: body.status,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        employee:employee_records!time_off_requests_employee_id_fkey (
          first_name,
          last_name
        )
      `)

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar solicitud';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/time-off/[id] - Cancelar solicitud
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que es la solicitud del usuario
    const { data: timeOff } = await supabase
      .from('time_off_requests')
      .select('employee_id, status')
      .eq('id', id)
      .single()

    if (!timeOff) throw new Error('Solicitud no encontrada')

    // Verificar que el usuario es el dueño de la solicitud
    const { data: employee } = await supabase
      .from('employee_records')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!employee || employee.id !== timeOff.employee_id) {
      throw new Error('No autorizado para cancelar esta solicitud')
    }

    // Solo permitir cancelar si está pendiente
    if (timeOff.status !== TIME_OFF_STATUS.PENDING) {
      throw new Error('Solo se pueden cancelar solicitudes pendientes')
    }

    const { error } = await supabase
      .from('time_off_requests')
      .update({
        status: TIME_OFF_STATUS.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Solicitud cancelada exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al cancelar solicitud';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
