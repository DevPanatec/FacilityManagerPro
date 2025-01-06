import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if exists
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Middleware session error:', error)
    }

    // Debug log
    console.log('Middleware check:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    })

    // Protected routes
    if (
      request.nextUrl.pathname.startsWith('/protected') ||
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/enterprise')
    ) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    // Redirect logged-in users away from auth pages
    if (session && (
      request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/register')
    )) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/protected/:path*',
    '/auth/:path*',
    '/admin/:path*',
    '/enterprise/:path*'
  ]
}