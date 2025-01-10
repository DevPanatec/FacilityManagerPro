import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function POST(request: Request) {
  try {
    const { id, email } = await request.json()

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'Se requiere id y email' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Verificar si el usuario ya existe
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El usuario ya existe', user: existingUser },
        { status: 200 }
      )
    }

    // Crear el usuario con el rol correspondiente
    const isAdmin = email === 'admin@facilitymanagerpro.com'
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id,
          email,
          role: isAdmin ? 'admin' : 'usuario',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error al crear usuario:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Usuario creado exitosamente', user: newUser },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error en create-user:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 