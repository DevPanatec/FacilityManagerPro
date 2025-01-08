import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
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

    // Registrar usuario en auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          hospital_id: body.hospital_id
        }
      }
    })

    if (signUpError) throw signUpError

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    // Crear usuario en la tabla users
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: body.email,
          first_name: body.first_name,
          last_name: body.last_name,
          hospital_id: body.hospital_id,
          role: body.role || 'usuario',
          status: 'active'
        }
      ])

    if (userError) {
      // Si falla la creación del usuario, intentar eliminar el auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw userError
    }

    // Registrar en logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: authData.user.id,
          action: 'register',
          description: 'New user registered',
          metadata: {
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            hospital_id: body.hospital_id,
            role: body.role || 'usuario'
          }
        }
      ])

    return NextResponse.json({
      user: authData.user,
      message: 'Registro exitoso. Por favor verifica tu email para continuar.'
    })

  } catch (error: any) {
    console.error('Error en /api/auth/register:', error)
    return NextResponse.json(
      { 
        error: error.message,
        details: error.status ? `HTTP ${error.status}` : 'Error interno del servidor'
      },
      { status: error.status || 400 }
    )
  }
} 