'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY, baseAuthConfig, baseGlobalConfig } from './config.base'

let supabaseClient: ReturnType<typeof createClientComponentClient<Database, 'public'>> | null = null;

// Cliente para componentes del lado del cliente
export const createClientSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database, 'public'>({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      options: {
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      }
    });
  }
  return supabaseClient;
}

// Instancia del cliente para uso general en el lado del cliente
export const supabase = createClientSupabase() 