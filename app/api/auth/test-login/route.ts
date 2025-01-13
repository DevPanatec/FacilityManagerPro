import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select()
      .eq('id', data.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ success: false, error: 'Error al obtener usuario' })
    }

    let redirectUrl = '/dashboard'
    if (user.role === 'admin') redirectUrl = '/admin/dashboard'
    if (user.role === 'enterprise') redirectUrl = '/enterprise/dashboard'

    return NextResponse.json({
      success: true,
      user,
      session: data.session,
      redirectUrl
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Error inesperado al iniciar sesión'
    })
  }
} 