import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener usuario actual antes de cerrar sesión
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Registrar el logout en logs
      await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: user.id,
            action: 'logout',
            description: 'User logged out',
            metadata: {
              ip: request.headers.get('x-forwarded-for'),
              userAgent: request.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            }
          }
        ])
    }

    // Cerrar sesión
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Crear respuesta con eliminación de cookies
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.delete('userRole')
    response.cookies.delete('isAuthenticated')
    response.cookies.delete('isSuperAdmin')

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 
