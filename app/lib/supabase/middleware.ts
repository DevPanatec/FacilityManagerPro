import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

export const createClient = (request: NextRequest) => {
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

  return { supabase, response }
} 