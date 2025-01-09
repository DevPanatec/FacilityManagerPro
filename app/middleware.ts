import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const handleCookies = (operation: 'set' | 'remove', name: string, value?: string, options?: CookieOptions) => {
    if (operation === 'set' && value) {
      request.cookies.set({ name, value, ...options })
      response.cookies.set({ name, value, ...options })
    } else {
      request.cookies.delete({ name, ...options })
      response.cookies.delete({ name, ...options })
    }
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          handleCookies('set', name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          handleCookies('remove', name, undefined, options)
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 