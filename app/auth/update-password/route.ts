import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error al actualizar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la contraseña' },
      { status: 500 }
    )
  }
} 