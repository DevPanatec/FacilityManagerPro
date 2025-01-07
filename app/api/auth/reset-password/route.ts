import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/auth/reset-password - Solicitar reset
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email } = await request.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
    })

    if (error) throw error

    // Registrar solicitud en logs
    await supabase
      .from('security_logs')
      .insert([
        {
          event: 'password_reset_requested',
          metadata: {
            email,
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
          }
        }
      ])

    return NextResponse.json({
      message: 'Password reset instructions sent to email'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// PUT /api/auth/reset-password - Actualizar contraseña
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { new_password } = await request.json()
    
    if (!new_password) {
      throw new Error('New password is required')
    }

    const { data: { user }, error } = await supabase.auth.updateUser({
      password: new_password
    })

    if (error) throw error

    // Registrar cambio en logs
    await supabase
      .from('security_logs')
      .insert([
        {
          user_id: user?.id,
          event: 'password_updated',
          metadata: {
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
          }
        }
      ])

    return NextResponse.json({
      message: 'Password updated successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
} 
