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

  try {
    // Permitir acceso a rutas públicas y assets inmediatamente
    const isPublicRoute = PUBLIC_ROUTES.some(route => req.nextUrl.pathname.startsWith(route));
    const isAsset = req.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|css|js)$/);
    
    if (isPublicRoute || isAsset || req.nextUrl.pathname.startsWith('/_next')) {
      return res;
    }

    // Verificar la sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Obtener el rol del usuario y verificar que exista en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id, organization_id, status')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Verificar que el usuario esté activo
    if (userData.status !== 'active') {
      return NextResponse.redirect(new URL('/auth/inactive', req.url))
    }

    // Obtener el rol y la ruta actual
    const userRole = userData.role;
    const currentPath = req.nextUrl.pathname;
    const rolePrefix = currentPath.split('/')[1];

    // Verificar si el usuario tiene acceso a la ruta
    const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || [];
    const hasAccess = allowedRoutes.some(route => currentPath.startsWith(route));

    if (!hasAccess) {
      // Redirigir al dashboard correspondiente según el rol
      return NextResponse.redirect(new URL(`/${userRole}/dashboard`, req.url))
    }

    // Configurar la respuesta con los datos de la sesión
    const response = NextResponse.next()
    response.headers.set('x-user-role', userData.role)
    response.headers.set('x-user-id', userData.id)
    response.headers.set('x-organization-id', userData.organization_id || '')

    return response

  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|ico|svg)$|public|api).*)',
  ],
}