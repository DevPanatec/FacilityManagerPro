import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Se requiere el email' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`
    })

    if (error) throw error

    return NextResponse.json({
      message: 'Se ha enviado un enlace para restablecer la contraseña'
    })
  } catch (error) {
    console.error('Error al restablecer contraseña:', error)
    return NextResponse.json(
      { error: 'Error al restablecer contraseña' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { new_password } = await request.json()
    
    if (!new_password) {
      return NextResponse.json(
        { error: 'Se requiere la nueva contraseña' },
        { status: 400 }
      )
    }

    const { data: { user }, error } = await supabase.auth.updateUser({
      password: new_password
    })

    if (error) throw error

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente'
    })
  } catch (error) {
    console.error('Error al actualizar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al actualizar contraseña' },
      { status: 500 }
    )
  }
} 