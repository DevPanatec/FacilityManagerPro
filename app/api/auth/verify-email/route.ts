import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/types/database'

// Cliente admin con service_role key
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email es requerido' 
      }, { status: 400 })
    }

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

    const user = userData.users.find(user => user.email === email)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, { status: 404 })
    }

    // 2. Actualizar el usuario como verificado
    const { error: updateError } = await supabaseAdmin.auth.admin
      .updateUserById(user.id, {
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
      message: 'Email verificado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        verified: true
      }
    })
    
  } catch (error) {
    console.error('Error al verificar email:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
} 