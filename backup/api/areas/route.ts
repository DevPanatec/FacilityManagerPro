import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/areas - Obtener áreas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    
    let query = supabase
      .from('areas')
      .select(`
        *,
        departments (
          id,
          name,
          organization_id
        )
      `)
      .eq('organization_id', organizationId)

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data: areas, error } = await query
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(areas)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/areas - Crear área
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .insert([{
        ...body,
        organization_id: organizationId
      }])
      .select()

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action: 'create_area',
        description: `Area created: ${body.name}`,
        organization_id: organizationId
      }])

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/areas/[id] - Actualizar área
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .update({
        name: body.name,
        description: body.description,
        department_id: body.department_id
      })
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/areas/[id] - Eliminar área
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID no proporcionado')

    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Área eliminada exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 