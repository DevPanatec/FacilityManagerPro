import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Validar datos requeridos
    if (!body.email || !body.password || !body.first_name || !body.last_name) {
      throw new Error('Todos los campos son requeridos')
    }

    // Registrar usuario
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name
        }
      }
    })

    if (signUpError) throw signUpError

    // Crear perfil de usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: authData.user?.id,
          first_name: body.first_name,
          last_name: body.last_name,
          organization_id: body.organization_id,
          role: body.role || 'user'
        }
      ])

    if (profileError) throw profileError

    // Registrar en logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: authData.user?.id,
          action: 'register',
          description: 'New user registered',
          metadata: {
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
          }
        }
      ])

    return NextResponse.json({
      user: authData.user,
      message: 'Registration successful. Please check your email for verification.'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
} 