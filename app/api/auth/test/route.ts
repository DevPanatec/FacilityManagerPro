import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Intentar login con las credenciales de prueba
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@pm.e',
      password: '1234'
    })

    // Verificar el usuario en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'test@pm.e')
      .single()

    return NextResponse.json({
      auth: {
        success: !authError,
        session: authData?.session ? true : false,
        error: authError?.message
      },
      user: {
        exists: !!userData,
        role: userData?.role,
        error: userError?.message
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 
