import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Cliente admin con service_role key para operaciones privilegiadas
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    console.log('=== INICIANDO PROCESO DE LOGIN ===')
    console.log('URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key presente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Anon Key presente:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const body = await request.json()
    const { email, password } = body

    console.log('Credenciales recibidas:', { email, password: '***' })

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email y contraseña son requeridos' 
      }, { status: 400 })
    }

    // Usar el cliente de Supabase del servidor
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    console.log('Intentando iniciar sesión con Supabase...')
    
    // Intentar iniciar sesión
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error('Error de autenticación:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: authError
      }, { status: 400 })
    }

    if (!authData.user) {
      console.error('No se recibieron datos del usuario')
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo obtener la información del usuario'
      }, { status: 400 })
    }

    console.log('Login exitoso, usuario auth:', {
      id: authData.user.id,
      email: authData.user.email,
      emailConfirmed: authData.user.email_confirmed_at
    })

    console.log('Consultando información adicional del usuario...')
    // Obtener datos adicionales del usuario usando el cliente admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError)
      
      // Intentar crear el perfil si no existe
      console.log('Intentando crear el perfil del usuario...')
      const { error: createError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email!,
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

      if (createError) {
        console.error('Error al crear perfil:', createError)
        return NextResponse.json({ 
          success: false, 
          error: 'Error al crear perfil de usuario',
          details: createError
        }, { status: 500 })
      }

      // Crear la respuesta con las cookies de sesión
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login exitoso - perfil creado',
        user: {
          ...authData.user,
          role: 'admin',
          status: 'active'
        },
        session: authData.session
      })

      // Establecer las cookies de sesión
      const sessionCookie = cookieStore.get('sb-session')
      if (sessionCookie) {
        response.cookies.set('sb-session', sessionCookie.value, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          httpOnly: true
        })
      }

      return response
    }

    console.log('Datos del usuario obtenidos:', userData)

    // Crear la respuesta con las cookies de sesión
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login exitoso',
      user: {
        ...authData.user,
        ...userData
      },
      session: authData.session
    })

    // Establecer las cookies de sesión
    const sessionCookie = cookieStore.get('sb-session')
    if (sessionCookie) {
      response.cookies.set('sb-session', sessionCookie.value, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true
      })
    }

    return response
    
  } catch (error) {
    console.error('Error en el proceso de login:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 