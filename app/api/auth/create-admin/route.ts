import { createServerSupabaseClient } from '@/lib/supabase/config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const adminEmail = 'admin@facilitymanagerpro.com'
const adminPassword = 'Admin@FMP2024'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // 1. Crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })
    
    if (authError) {
      console.error('Error al crear usuario:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo crear el usuario' 
      }, { status: 500 })
    }

    // 2. Insertar en la tabla users con rol admin
    const { error: userError } = await supabase
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
        error: userError.message 
      }, { status: 500 })
    }

    // 3. Crear perfil del usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        email: adminEmail
      })

    if (profileError) {
      console.error('Error al crear perfil:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: profileError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario administrador creado exitosamente',
      user: {
        id: authData.user.id,
        email: adminEmail,
        role: 'admin'
      }
    })
    
  } catch (error) {
    console.error('Error al crear usuario admin:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
} 