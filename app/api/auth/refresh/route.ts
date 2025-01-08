import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar sesión actual
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    
    if (!currentSession) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    // Verificar si el token necesita renovación
    const expiresAt = currentSession.expires_at
    const now = Math.floor(Date.now() / 1000)
    
    if (expiresAt && expiresAt > now + 60) { // Si falta más de 1 minuto para expirar
      return NextResponse.json({
        message: 'Token still valid',
        access_token: currentSession.access_token,
        expires_at: currentSession.expires_at
      })
    }

    // Refrescar la sesión
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Error refreshing session:', error)
      throw error
    }
    
    if (!session) {
      console.error('No session after refresh')
      throw new Error('Failed to refresh session')
    }

    // Registrar refresh en logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: session.user.id,
          action: 'token_refresh',
          description: 'Session token refreshed',
          metadata: {
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            old_expires_at: currentSession.expires_at,
            new_expires_at: session.expires_at
          }
        }
      ])

    return NextResponse.json({
      message: 'Token refreshed successfully',
      access_token: session.access_token,
      expires_at: session.expires_at
    })
  } catch (error: any) {
    console.error('Error in /api/auth/refresh:', error)
    return NextResponse.json(
      { 
        error: error.message,
        details: error.status ? `HTTP ${error.status}` : 'Internal server error'
      },
      { 
        status: error.status || 
          (error.message?.includes('No session') ? 401 : 500)
      }
    )
  }
} 
