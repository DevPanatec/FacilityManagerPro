import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

// Cliente admin con service_role key
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
    console.log('Verificando conexión con Supabase...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // 1. Listar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error al listar usuarios:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: {
          code: authError.status,
          name: authError.name
        }
      }, { status: 500 })
    }

    // 2. Obtener usuarios de la tabla users
    const { data: tableUsers, error: tableError } = await supabaseAdmin
      .from('users')
      .select('*')

    if (tableError) {
      console.error('Error al obtener usuarios de la tabla:', tableError)
      return NextResponse.json({ 
        success: false, 
        error: tableError.message,
        details: {
          code: tableError.code,
          hint: tableError.hint
        }
      }, { status: 500 })
    }

    // 3. Obtener perfiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (profileError) {
      console.error('Error al obtener perfiles:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: profileError.message,
        details: {
          code: profileError.code,
          hint: profileError.hint
        }
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuarios encontrados',
      data: {
        auth: authUsers.users.map(user => ({
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at !== null,
          lastSignIn: user.last_sign_in_at,
          metadata: user.user_metadata
        })),
        users: tableUsers,
        profiles: profiles
      }
    })
    
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 