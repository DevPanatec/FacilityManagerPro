import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
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

      // Establecer cookies de sesión
      const response = NextResponse.next()
      response.cookies.set('session', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      response.cookies.set('role', userData?.role || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })

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

      return response
    }

    return res

  } catch (error) {
    console.error('Error en middleware:', error)
    // Limpiar cookies en caso de error
    const response = NextResponse.redirect(new URL('/auth/login', req.url))
    response.cookies.delete('session')
    response.cookies.delete('role')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 