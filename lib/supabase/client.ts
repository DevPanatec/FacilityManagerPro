'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY, baseAuthConfig, baseGlobalConfig } from './config.base'

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Cliente para componentes del lado del cliente
export const createClientSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>();
  }
  return supabaseClient;
}

// Instancia del cliente para uso general en el lado del cliente
export const supabase = createClientSupabase() 