import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

const adminEmail = 'admin@fmanager.com'
const adminPassword = 'Admin123456!'

// Cliente admin con service_role key para poder crear usuarios verificados
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    console.log('Iniciando creación de usuario admin...')
    console.log('URL de Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // 1. Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUser.users.find(u => u.email === adminEmail)

    if (adminExists) {
      console.log('El usuario admin ya existe:', adminExists.id)
      
      // Intentar crear el registro en users si no existe
      const { data: existingUserData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', adminExists.id)
        .single()

      if (!existingUserData) {
        console.log('Creando registro en tabla users...')
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: adminExists.id,
            email: adminEmail,
            role: 'admin',
            status: 'active'
          })

        if (userError) {
          console.error('Error al crear registro en users:', userError)
          return NextResponse.json({ 
            success: false, 
            error: 'Error al crear registro en users',
            details: userError
          })
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Usuario admin actualizado',
        user: {
          id: adminExists.id,
          email: adminEmail,
          role: 'admin',
          verified: true
        }
      })
    }

    // 2. Crear el usuario directamente verificado
    console.log('Creando usuario en auth.users...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        role: 'admin',
        verified: true
      }
    })
    
    if (authError) {
      console.error('Error al crear usuario:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: {
          code: authError.status,
          name: authError.name
        }
      }, { status: 500 })
    }

    if (!authData.user) {
      console.error('No se recibieron datos del usuario creado')
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo crear el usuario' 
      }, { status: 500 })
    }

    console.log('Usuario creado en auth:', authData.user.id)

    // 3. Insertar en la tabla users con rol admin
    console.log('Insertando en tabla users...')
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        role: 'admin',
        email: adminEmail
      })

    if (userError) {
      console.error('Error al crear perfil de usuario:', userError)
      return NextResponse.json({ 
        success: false, 
        error: userError.message,
        details: {
          code: userError.code,
          hint: userError.hint,
          details: userError.details
        }
      }, { status: 500 })
    }

    console.log('Usuario insertado en tabla users')

    // 4. Crear perfil del usuario
    console.log('Creando perfil...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'Administrador'
      })

    if (profileError) {
      console.error('Error al crear perfil:', profileError)
      // Continuamos aunque haya error en el perfil ya que el usuario ya está creado
      console.log('Continuando aunque hubo error en el perfil...')
    }

    console.log('Proceso completado')

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario administrador creado y verificado exitosamente',
      user: {
        id: authData.user.id,
        email: adminEmail,
        role: 'admin',
        verified: true
      }
    })
    
  } catch (error) {
    console.error('Error al crear usuario admin:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 