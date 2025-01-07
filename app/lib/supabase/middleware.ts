import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './rate-limit'

export const runtime = 'edge'

// CSP Directives
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", process.env.NEXT_PUBLIC_SUPABASE_URL!],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"]
}

const cspString = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(' ')}`)
  .join('; ')

export async function middleware(req: NextRequest) {
  // 1. Rate limiting
  try {
    const { success, limit, remaining, reset } = await rateLimit(req)
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: reset
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': reset.toString()
          }
        }
      )
    }
  } catch (error) {
    console.error('Rate limit error:', error)
  }

  // 2. Response setup
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    // 3. Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              priority: 'high'
            })
          },
          remove(name: string, options: any) {
            response.cookies.delete({
              name,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
        },
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )

    // 4. Session handling
    const { data: { session } } = await supabase.auth.getSession()

    // 5. Route protection
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/reset-password']
    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    )

    if (isPublicPath && session) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', session.user.id)
        .single()

      if (userData?.status === 'active') {
        const targetPath = getRedirectPath(userData.role)
        return NextResponse.redirect(new URL(targetPath, req.url))
      }
    }

    const protectedPaths = ['/admin', '/user', '/enterprise']
    const isProtectedPath = protectedPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath) {
      if (!session) {
        const searchParams = new URLSearchParams([
          ['returnTo', req.nextUrl.pathname]
        ])
        return NextResponse.redirect(
          new URL(`/auth/login?${searchParams}`, req.url)
        )
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, status, is_locked, lock_until')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      if (userData.is_locked) {
        const lockUntil = new Date(userData.lock_until)
        if (lockUntil > new Date()) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            new URL('/auth/login?error=account_locked', req.url)
          )
        }
      }

      if (userData.status !== 'active') {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/auth/login?error=inactive', req.url)
        )
      }

      const currentPath = req.nextUrl.pathname
      const hasAccess = checkRoleAccess(currentPath, userData.role)

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }

      await supabase
        .from('activity_logs')
        .insert({
          user_id: session.user.id,
          action: 'page_access',
          description: `Accessed ${currentPath}`,
          metadata: {
            path: currentPath,
            role: userData.role,
            status: userData.status,
            ip: req.ip,
            userAgent: req.headers.get('user-agent') ?? 'unknown'
          }
        })
        .select()

      await supabase
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.user.id)
    }

    // 6. Security headers
    const nonce = crypto.randomUUID()
    
    response.headers.set('Content-Security-Policy', cspString)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
    response.headers.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
    )
    
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // 7. Cache control
    if (!isProtectedPath) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=3600, must-revalidate'
      )
    } else {
      response.headers.set(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate'
      )
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'superadmin':
      return '/admin/superadmin'
    case 'admin':
      return '/admin/dashboard'
    case 'enterprise':
      return '/enterprise/dashboard'
    default:
      return '/user/usuario'
  }
}

function checkRoleAccess(path: string, role: string): boolean {
  const roleRoutes = {
    superadmin: ['/admin', '/enterprise', '/user'],
    admin: ['/admin', '/user'],
    enterprise: ['/enterprise'],
    usuario: ['/user']
  }

  const allowedPaths = roleRoutes[role as keyof typeof roleRoutes] || ['/user']
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/|auth/callback).*)',
  ],
} 
