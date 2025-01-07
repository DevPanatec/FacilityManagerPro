import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/attendance - Obtener registros de asistencia
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        employee:employee_records!attendance_records_employee_id_fkey (
          id,
          first_name,
          last_name,
          position,
          department_id
        )
      `)
      .order('check_in', { ascending: false })

    if (employeeId) query = query.eq('employee_id', employeeId)
    if (startDate) query = query.gte('check_in', startDate)
    if (endDate) query = query.lte('check_in', endDate)

    const { data: attendance, error } = await query

    if (error) throw error

    return NextResponse.json(attendance)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al obtener registros de asistencia';
    const statusCode = error instanceof Error && error.message.includes('No autorizado')
      ? 403
      : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/attendance - Registrar asistencia
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar si ya existe un registro para hoy
    const today = new Date().toISOString().split('T')[0]
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', body.employee_id || user.id)
      .gte('check_in', today)
      .lte('check_in', today + 'T23:59:59')
      .maybeSingle()

    if (existingRecord) {
      throw new Error('Ya existe un registro de asistencia para hoy')
    }

    // Crear registro de asistencia
    const { data, error } = await supabase
      .from('attendance_records')
      .insert([
        {
          employee_id: body.employee_id || user.id,
          check_in: body.check_in || new Date().toISOString(),
          check_out: body.check_out,
          location_data: body.location_data || null
        }
      ])
      .select(`
        *,
        employee:employee_records!attendance_records_employee_id_fkey (
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
          action: 'create_attendance',
          description: `Attendance check-in recorded`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al registrar asistencia';
    const statusCode = error instanceof Error && error.message.includes('No autorizado')
      ? 403
      : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT handler should be at the module level, not nested
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que es el registro del usuario
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', body.id)
      .single()

    if (!attendance) {
      throw new Error('Registro no encontrado')
    }

    // Verificar que el registro es del usuario o tiene permisos
    const { data: employee } = await supabase
      .from('employee_records')
      .select('user_id')
      .eq('id', attendance.employee_id)
      .single()

    if (!employee || employee.user_id !== user.id) {
      throw new Error('No autorizado para actualizar este registro')
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        check_out: body.check_out || new Date().toISOString(),
        location_data: {
          ...(attendance.location_data || {}),
          ...(body.location_data || {})
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al actualizar registro de asistencia';
    const statusCode = error instanceof Error && error.message.includes('No autorizado')
      ? 403
      : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
