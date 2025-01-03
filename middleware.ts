import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware ejecutándose en:', request.nextUrl.pathname)

  // No aplicar middleware a rutas públicas
  if (request.nextUrl.pathname.startsWith('/auth')) {
    console.log('Ruta pública, permitiendo acceso')
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
          const cookie = request.cookies.get(name)
          console.log('Leyendo cookie:', name, cookie?.value)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('Estableciendo cookie:', name, value)
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: true
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log('Eliminando cookie:', name)
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: true,
            maxAge: 0
          })
        },
      },
    }
  )

  try {
    console.log('Verificando sesión...')
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error al obtener sesión:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!session) {
      console.log('No hay sesión activa, redirigiendo a login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    console.log('Sesión encontrada:', session.user.id)

    // Verificar el rol del usuario para rutas protegidas
    if (request.nextUrl.pathname.startsWith('/admin')) {
      console.log('Verificando permisos de administrador...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('Error al obtener rol del usuario:', userError)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
        console.log('Usuario sin permisos de administrador:', userData?.role)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      console.log('Permisos de administrador verificados:', userData.role)
    }

    // Agregar el ID del usuario y rol al header para uso en la API
    response.headers.set('x-user-id', session.user.id)
    console.log('Headers establecidos, permitiendo acceso')
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