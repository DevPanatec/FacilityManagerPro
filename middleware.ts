import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/app/lib/supabase/types'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
  '/about',
  '/contact'
];

// Rutas permitidas por rol
const ROLE_ROUTES = {
  superadmin: ['/superadmin', '/admin', '/enterprise'],
  admin: ['/admin', '/enterprise'],
  enterprise: ['/enterprise'],
  usuario: ['/user']
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refrescar la sesión si existe
  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Si no hay sesión y la ruta requiere autenticación, redirigir a login
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  const isPublicRoute = req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/login'

  if (!session && !isAuthRoute && !isApiRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si hay sesión y está en login/registro, redirigir al dashboard
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// Configurar las rutas que deben ser manejadas por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}