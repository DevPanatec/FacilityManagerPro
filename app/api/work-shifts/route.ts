import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/work-shifts - Obtener turnos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('work_shifts')
      .select('*')
      .order('name', { ascending: true })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: shifts, error } = await query

    if (error) throw error

    return NextResponse.json(shifts)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al obtener turnos'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// POST /api/work-shifts - Crear turno
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Obtener organization_id del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Validar días de la semana (0-6, donde 0 es domingo)
    if (body.days_of_week) {
      const validDays = body.days_of_week.every((day: number) => 
        Number.isInteger(day) && day >= 0 && day <= 6
      )
      if (!validDays) {
        throw new Error('Días de la semana inválidos')
      }
    }

    // Crear turno
    const { data, error } = await supabase
      .from('work_shifts')
      .insert([
        {
          organization_id: profile.organization_id,
          name: body.name,
          start_time: body.start_time,
          end_time: body.end_time,
          days_of_week: body.days_of_week
        }
      ])
      .select()

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_work_shift',
          description: `Work shift created: ${body.name}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al crear turno'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// PUT /api/work-shifts/[id] - Actualizar turno
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar permisos (debe ser de la misma organización)
    const { data: shift } = await supabase
      .from('work_shifts')
      .select('organization_id')
      .eq('id', body.id)
      .single()

    if (!shift) throw new Error('Turno no encontrado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.organization_id !== shift.organization_id) {
      throw new Error('No autorizado para actualizar este turno')
    }

    // Validar días de la semana
    if (body.days_of_week) {
      const validDays = body.days_of_week.every((day: number) => 
        Number.isInteger(day) && day >= 0 && day <= 6
      )
      if (!validDays) {
        throw new Error('Días de la semana inválidos')
      }
    }

    const { data, error } = await supabase
      .from('work_shifts')
      .update({
        name: body.name,
        start_time: body.start_time,
        end_time: body.end_time,
        days_of_week: body.days_of_week,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al actualizar turno'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

// DELETE /api/work-shifts/[id] - Eliminar turno
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar permisos (debe ser de la misma organización)
    const { data: shift } = await supabase
      .from('work_shifts')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (!shift) throw new Error('Turno no encontrado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.organization_id !== shift.organization_id) {
      throw new Error('No autorizado para eliminar este turno')
    }

    // Verificar que no hay empleados asignados
    const { data: employees } = await supabase
      .from('employee_records')
      .select('id')
      .eq('work_shift_id', id)
      .limit(1)

    if (employees && employees.length > 0) {
      throw new Error('No se puede eliminar un turno con empleados asignados')
    }

    const { error } = await supabase
      .from('work_shifts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Turno eliminado exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al eliminar turno'
    
    const status = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
} 
