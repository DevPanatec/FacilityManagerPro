import { createBrowserClient } from '@supabase/ssr'
import { CookieOptions } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set(name: string, value: string, options: CookieOptions) {
          let cookie = `${name}=${value}; path=${options.path}`
          if (options.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          if (options.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          if (options.secure) {
            cookie += '; secure'
          }
          document.cookie = cookie
        },
        remove(name: string, options: CookieOptions) {
          document.cookie = `${name}=; path=${options.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
} 