import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET users with optional filters
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        department_id,
        created_at,
        updated_at
      `)

    // Aplicar filtros si existen
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    
    if (role) query = query.eq('role', role)
    if (department) query = query.eq('department_id', department)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST new user
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar autenticación y rol admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: adminCheck } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminCheck || !['admin', 'superadmin'].includes(adminCheck.role)) {
      throw new Error('No autorizado - Se requiere rol de administrador')
    }

    // Crear usuario
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role,
        department_id: body.department_id
      }])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 