import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener sesión actual
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (*),
        roles (
          id,
          name,
          permissions (
            resource,
            action,
            conditions
          )
        )
      `)
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      profile,
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 