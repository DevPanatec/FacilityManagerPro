import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

const adminEmail = 'admin@facilitymanagerpro.com'
const adminPassword = 'Admin@FMP2024'

export async function GET() {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    
    if (error) {
      console.error('Error al iniciar sesión:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    // Obtener el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('Error al obtener rol del usuario:', userError)
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login exitoso',
      user: {
        ...data.user,
        role: userData.role
      }
    })
    
  } catch (error) {
    console.error('Error al probar el login:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
} 