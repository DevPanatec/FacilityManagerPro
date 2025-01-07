import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session) {
      return NextResponse.json({ 
        authenticated: false 
      })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status, first_name, last_name, avatar_url, hospital_id')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          ...session.user,
          ...userData
        },
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Refresh the session
    const { data: refreshedSession, error: refreshError } = 
      await supabase.auth.refreshSession()

    if (refreshError) {
      throw refreshError
    }

    // Update cookies with new tokens
    const cookieStore = cookies()
    if (refreshedSession.session?.access_token) {
      cookieStore.set('sb-token', refreshedSession.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
    }
    if (refreshedSession.session?.refresh_token) {
      cookieStore.set('sb-refresh-token', refreshedSession.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return NextResponse.json({
      session: refreshedSession.session
    })

  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
