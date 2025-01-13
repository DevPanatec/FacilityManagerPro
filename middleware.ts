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

    // Si es la ruta raíz, redirigir al login
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Rutas públicas que no requieren autenticación
    const isPublicPath = req.nextUrl.pathname.startsWith('/auth/')

    // Si no hay sesión y no es una ruta pública, redirigir al login
    if (!session && !isPublicPath && !req.nextUrl.pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Si hay sesión y es una ruta pública, permitir el acceso
    if (session && isPublicPath) {
      return res
    }

    // Proteger rutas según el rol
    if (session && !isPublicPath) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Proteger rutas de admin
      if (req.nextUrl.pathname.startsWith('/admin') && userData?.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Proteger rutas de enterprise
      if (req.nextUrl.pathname.startsWith('/enterprise') && userData?.role !== 'enterprise') {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Redirigir /dashboard a la ruta correcta según el rol
      if (req.nextUrl.pathname === '/dashboard') {
        if (userData?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        } else if (userData?.role === 'enterprise') {
          return NextResponse.redirect(new URL('/enterprise/dashboard', req.url))
        }
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