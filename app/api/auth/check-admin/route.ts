import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

const adminEmail = 'admin@facilitymanagerpro.com'

// Cliente admin con service_role key
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1. Verificar en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error al buscar usuario en auth:', authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 500 })
    }

    const authUser = authData.users.find(user => user.email === adminEmail)

    // 2. Verificar en tabla users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (userError && userError.code !== 'PGRST116') { // Ignorar error de no encontrado
      console.error('Error al buscar usuario en tabla users:', userError)
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 })
    }

    // Devolver el resultado
    return NextResponse.json({
      success: true,
      exists: {
        inAuth: !!authUser,
        inUsers: !!userData
      }
    })
    
  } catch (error) {
    console.error('Error al verificar usuario admin:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
} 