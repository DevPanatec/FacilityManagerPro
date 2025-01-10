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
    // 1. Obtener el usuario por email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin
      .listUsers()

    if (userError) {
      console.error('Error al buscar usuario:', userError)
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 })
    }

    const adminUser = userData.users.find(user => user.email === adminEmail)
    
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario admin no encontrado' 
      }, { status: 404 })
    }

    // 2. Actualizar el usuario como verificado
    const { error: updateError } = await supabaseAdmin.auth.admin
      .updateUserById(adminUser.id, {
        email_confirm: true,
        user_metadata: { verified: true }
      })

    if (updateError) {
      console.error('Error al verificar usuario:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario admin verificado exitosamente',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        verified: true
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