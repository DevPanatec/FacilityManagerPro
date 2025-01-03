import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) throw sessionError

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        hospital:hospital_id (
          id,
          name
        )
      `)
      .eq('id', session.user.id)
      .single()

    if (userError) throw userError

    // Registrar actividad
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: session.user.id,
          action: 'session_check',
          description: 'User session verified',
          metadata: {
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        }
      ])

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session.user,
        ...userData,
        session: {
          access_token: session.access_token,
          expires_at: session.expires_at
        }
      }
    })
  } catch (error: any) {
    console.error('Error en /api/auth/session:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    )
  }
} 