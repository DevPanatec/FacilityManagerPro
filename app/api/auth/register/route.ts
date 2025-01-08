import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email, password, role, firstName, lastName } = await request.json()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
} 