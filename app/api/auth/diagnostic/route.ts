import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check auth user first
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()

    return NextResponse.json({
      authUser: {
        exists: !!authUser,
        id: authUser?.id,
        email: authUser?.email,
        error: authError?.message
      },
      userData: {
        exists: !!userData,
        id: userData?.id,
        email: userData?.email,
        role: userData?.role,
        error: userError?.message
      },
      consistent: authUser?.id === userData?.id
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 })
  }
} 