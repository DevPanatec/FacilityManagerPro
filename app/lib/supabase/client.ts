import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

export const createClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    }
  })
}

// Cliente singleton para uso en servicios
export const supabase = createClient() 