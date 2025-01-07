import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Configuración OAuth según docs
        providers: ['google', 'github'],
        // Manejo de recuperación de sesión
        storageKey: 'supabase-auth',
        storage: {
          getItem: (key) => {
            try {
              return Promise.resolve(localStorage.getItem(key))
            } catch {
              return Promise.resolve(null)
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value)
              return Promise.resolve()
            } catch {
              return Promise.resolve()
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key)
              return Promise.resolve()
            } catch {
              return Promise.resolve()
            }
          }
        }
      }
    }
  )
} 
