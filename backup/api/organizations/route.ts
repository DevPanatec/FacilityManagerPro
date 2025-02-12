import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ORGANIZATION_STATUS } from './types'
import { handleError } from '@/app/utils/errorHandler'

// GET /api/organizations - Obtener organizaciones
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(organizations)
  } catch (error) {
    return handleError(error)
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
    const { data: organization, error } = await supabase
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
      .single()

    if (error) throw error

    // Crear perfil para el usuario creador
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organization_id: organization.id })
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

    return NextResponse.json(organization)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/organizations/[id] - Actualizar organización
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { id, ...updateData } = body

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
      throw new Error('No autorizado para actualizar esta organización')
    }

    // Validar status
    if (body.status && !(body.status in ORGANIZATION_STATUS)) {
      throw new Error('Estado no válido')
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(organization)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/organizations/[id] - Eliminar organización
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      throw new Error('ID de organización no proporcionado')
    }

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
  } catch (error) {
    return handleError(error)
  }
} 