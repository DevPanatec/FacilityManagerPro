import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface AuthError extends Error {
  status?: number;
  code?: string;
}

export async function updateSession(request: NextRequest) {
  try {
    // Create a response object that we can return
    const requestHeaders = new Headers(request.headers)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/'
            })
          },
          remove(name, options) {
            response.cookies.delete({
              name,
              ...options,
              path: '/'
            })
          },
        },
        global: {
          headers: {
            'x-application-name': 'facility-manager-pro'
          }
        }
      }
    )

    // Refresh the session if it exists
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      // Clear invalid session
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    // If we have a session, check if it needs refresh
    if (session) {
      const { data: { user }, error: refreshError } = await supabase.auth.getUser()
      
      if (refreshError || !user) {
        console.error('User validation error:', refreshError)
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
      }
    }

    return response
  } catch (error) {
    const authError = error as AuthError
    console.error('Middleware error:', {
      message: authError.message,
      status: authError.status,
      code: authError.code
    })
    
    // En caso de error, devolver una respuesta limpia
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
