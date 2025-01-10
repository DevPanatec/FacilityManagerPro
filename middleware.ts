import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function middleware(req: NextRequest) {
  // Inicializar el cliente de Supabase
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    // Obtener la sesión actual
    const { data: { session } } = await supabase.auth.getSession()

    // Rutas públicas que no requieren autenticación
    const publicPaths = ['/auth/login', '/auth/register']
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path)

    // Si no hay sesión y no es una ruta pública, redirigir al login
    if (!session && !isPublicPath && !req.nextUrl.pathname.startsWith('/_next')) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Si hay sesión y es una ruta pública, redirigir según el rol
    if (session && isPublicPath) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Si es una ruta de admin, verificar el rol
    if (req.nextUrl.pathname.startsWith('/admin') && session) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userData?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Redirigir la raíz según el estado de autenticación y rol
    if (req.nextUrl.pathname === '/') {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return res

  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}