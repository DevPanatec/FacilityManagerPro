import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ORGANIZATION_STATUS } from './types'

// GET /api/organizations - Obtener organizaciones
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })

    if (id) {
      query = query.eq('id', id)
    }

    const { data: organizations, error } = await query

    if (error) throw error

    return NextResponse.json(organizations)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener organizaciones';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/organizations - Crear organización
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar status
    if (body.status && !(body.status in ORGANIZATION_STATUS)) {
      throw new Error('Estado no válido')
    }

    // Crear organización
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          name: body.name,
          description: body.description,
          logo_url: body.logo_url,
          website: body.website,
          tax_id: body.tax_id,
          status: body.status || ORGANIZATION_STATUS.ACTIVE
        }
      ])
      .select()

    if (error) throw error

    // Crear perfil para el usuario creador
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organization_id: data[0].id })
      .eq('user_id', user.id)

    if (profileError) throw profileError

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_organization',
          description: `Organization created: ${body.name}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear organización';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT /api/organizations/[id] - Actualizar organización
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar permisos
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.organization_id !== body.id) {
      throw new Error('No autorizado para actualizar esta organización')
    }

    // Validar status
    if (body.status && !(body.status in ORGANIZATION_STATUS)) {
      throw new Error('Estado no válido')
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        description: body.description,
        logo_url: body.logo_url,
        website: body.website,
        tax_id: body.tax_id,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar organización';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/organizations/[id] - Eliminar organización
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar permisos
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.organization_id !== id) {
      throw new Error('No autorizado para eliminar esta organización')
    }

    // Verificar que no hay empleados
    const { data: employees } = await supabase
      .from('employee_records')
      .select('id')
      .eq('organization_id', id)
      .limit(1)

    if (employees && employees.length > 0) {
      throw new Error('No se puede eliminar una organización con empleados')
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Organización eliminada exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar organización';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 