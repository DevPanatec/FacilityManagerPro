import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user role and permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, permissions')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.user.id)
    requestHeaders.set('x-user-role', profile.role)
    requestHeaders.set('x-user-permissions', JSON.stringify(profile.permissions))

    // Clone the request with new headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     * - auth/callback (Auth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/|auth/callback).*)',
  ],
} 
