import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente para componentes del lado del cliente
export const createClientSupabase = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
  })
}

// Cliente para componentes del lado del servidor
export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ 
    cookies
  })
}

// Instancia del cliente para uso general en el lado del cliente
export const supabase = createClientSupabase() 