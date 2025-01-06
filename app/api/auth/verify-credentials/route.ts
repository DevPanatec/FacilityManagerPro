import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('User verification error:', userError)
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: !!userData })
  } catch (error) {
    console.error('Credential verification error:', error)
    return NextResponse.json({ exists: false })
  }
} 