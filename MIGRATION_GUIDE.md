# Guía de Migración a Supabase SSR

## Cambios en las importaciones

### Cliente del Navegador (Client Components)
```typescript
// Antes
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient<Database>()

// Después
import { createBrowserClient } from '@supabase/ssr'
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Servidor (Server Components)
```typescript
// Antes
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
const supabase = createServerComponentClient<Database>({ cookies })

// Después
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
const cookieStore = cookies()
const supabase = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set(name, value, options)
      },
      remove(name, options) {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      }
    }
  }
)
```

### Middleware
```typescript
// Antes
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
const supabase = createMiddlewareClient<Database>({ req, res })

// Después
import { createServerClient } from '@supabase/ssr'
const cookieStore = cookies()
const supabase = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set(name, value, options)
      },
      remove(name, options) {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      }
    }
  }
)
```

### Manejadores de Rutas (Route Handlers)
```typescript
// Antes
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
const supabase = createRouteHandlerClient<Database>({ cookies })

// Después
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
const cookieStore = cookies()
const supabase = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set(name, value, options)
      },
      remove(name, options) {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      }
    }
  }
)
```

## Resumen de Cambios

| Antes                          | Después                    |
|--------------------------------|----------------------------|
| `createClientComponentClient`  | `createBrowserClient`      |
| `createServerComponentClient`  | `createServerClient`       |
| `createMiddlewareClient`       | `createServerClient`       |
| `createRouteHandlerClient`     | `createServerClient`       |

## Actualizaciones Necesarias

1. Actualizar dependencias en `package.json`
2. Crear archivos de utilidad para los diferentes tipos de clientes
3. Utilizar estos archivos de utilidad en lugar de importar directamente de `@supabase/auth-helpers-nextjs`
4. Verificar la funcionalidad después de las actualizaciones

## Configuración recomendada de archivos de utilidad

### `/app/lib/supabase/client.ts` (Navegador)
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `/app/lib/supabase/server.ts` (Servidor)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../types/database'

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
} 