import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { email, password, action } = await request.json()

  try {
    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return NextResponse.json(data)
    } 
    
    if (action === 'logout') {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return NextResponse.json({ message: 'Logged out successfully' })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 