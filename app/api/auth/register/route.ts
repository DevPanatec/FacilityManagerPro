import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    const body = await request.json()
    
    // Validar datos requeridos
    const requiredFields = ['email', 'password', 'first_name', 'last_name', 'hospital_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Registrar usuario en auth con verificación de email
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          hospital_id: body.hospital_id
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    })

    if (signUpError) throw signUpError

    // Registrar el intento de registro en activity_logs
    await supabase.from('activity_logs').insert({
      action: 'registration_attempt',
      description: 'Intento de registro de nuevo usuario',
      metadata: {
        email: body.email,
        hospital_id: body.hospital_id,
        success: true
      }
    })

    const response = NextResponse.json({
      message: 'Registro exitoso. Por favor verifica tu correo electrónico.',
      user: authData.user,
      status: 'pending_verification'
    })

    return response

  } catch (error: unknown) {
    console.error('Error en registro:', error)
    
    // Registrar el error en activity_logs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    await supabase.from('activity_logs').insert({
      action: 'registration_error',
      description: 'Error durante el registro de usuario',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    return NextResponse.json(
      { error: 'Error en el registro. Por favor intenta nuevamente.' },
      { status: 500 }
    )
  }
} 
