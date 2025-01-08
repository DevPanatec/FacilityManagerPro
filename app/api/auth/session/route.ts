import { createClient } from '../../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Check if token needs refresh
    const { data: { user }, error: refreshError } = await supabase.auth.getUser()

    if (refreshError) {
      return NextResponse.json({ error: refreshError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    // Refresh session if needed
    const { data: refreshedSession, error: sessionError } = await supabase.auth.refreshSession()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    if (!refreshedSession?.session) {
      return NextResponse.json({ error: 'Could not refresh session' }, { status: 500 })
    }

    return NextResponse.json({ session: refreshedSession.session })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
