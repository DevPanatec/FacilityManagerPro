import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Login del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (authError) throw authError

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (*),
        roles (*)
      `)
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) throw profileError

    // Registrar el login en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: authData.user.id,
          action: 'login',
          description: 'User logged in'
        }
      ])

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
      profile: profile
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en la autenticación' },
      { status: 401 }
    )
  }
}

// POST /api/auth/register
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Registrar usuario
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password
    })

    if (authError) throw authError

    // Crear perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: userData.user.id,
          organization_id: body.organization_id,
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          position: body.position
        }
      ])
      .select()
      .single()

    if (profileError) throw profileError

    return NextResponse.json({ 
      user: userData.user,
      profile: profile
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en el registro' },
      { status: 400 }
    )
  }
}

// POST /api/auth/logout
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual antes de cerrar sesión
    const { data: { user } } = await supabase.auth.getUser()
    
    // Registrar en activity_logs
    if (user) {
      await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: user.id,
            action: 'logout',
            description: 'User logged out'
          }
        ])
    }

    // Cerrar sesión
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return NextResponse.json({ message: 'Sesión cerrada exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
} 