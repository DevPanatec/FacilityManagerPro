import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // No aplicar middleware a rutas públicas
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error al obtener sesión:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!session) {
      console.log('No hay sesión activa')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verificar el rol del usuario para rutas protegidas
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
        console.log('Usuario sin permisos de administrador')
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    // Agregar el ID del usuario al header para uso en la API
    response.headers.set('x-user-id', session.user.id)
    return response

  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ]
}