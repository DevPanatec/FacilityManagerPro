import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
} 