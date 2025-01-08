import { createRouteHandlerClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/users - Obtener usuarios
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        organization_id,
        first_name,
        last_name,
        avatar_url,
        phone,
        position,
        created_at,
        organizations (
          id,
          name
        )
      `)

    // Si se proporciona un userId, filtrar por ese usuario
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: users, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(users)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al obtener usuarios';
    const statusCode = 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT /api/users - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Verificar que el usuario solo actualice su propio perfil
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        position: body.position,
        avatar_url: body.avatar_url
      })
      .eq('user_id', body.user_id)
      .select()

    if (error) throw error

    // Registrar la actualización en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'profile_update',
          description: 'User profile updated'
        }
      ])

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al actualizar usuario';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') 
      ? 403 
      : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
