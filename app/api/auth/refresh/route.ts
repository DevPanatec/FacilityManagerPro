import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Refrescar la sesión
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) throw error
    if (!session) throw new Error('No session found')

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
            timestamp: new Date().toISOString()
          }
        }
      ])

    return NextResponse.json({
      access_token: session.access_token,
      expires_at: session.expires_at
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No session') ? 401 : 500 }
    )
  }
} 