import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    // Permitir acceso a rutas públicas y assets inmediatamente
    if (req.nextUrl.pathname.startsWith('/auth/') || 
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname === '/' ||
        req.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
      return res
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
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Configurar la respuesta con los datos de la sesión
    const response = NextResponse.next()
    response.headers.set('x-user-role', userData.role)
    response.headers.set('x-user-id', userData.id)

    // Verificar rutas compartidas
    if (req.nextUrl.pathname.startsWith('/shared')) {
      const allowedRoles = ['superadmin', 'admin', 'enterprise']
      if (allowedRoles.includes(userData.role)) {
        return response
      }
      return NextResponse.redirect(new URL(`/${userData.role}/dashboard`, req.url))
    }

    // Verificar rutas específicas por rol
    const rolePrefix = req.nextUrl.pathname.split('/')[1]
    if (rolePrefix === userData.role) {
      return response
    }

    // Si no tiene acceso, redirigir a su dashboard
    return NextResponse.redirect(new URL(`/${userData.role}/dashboard`, req.url))

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