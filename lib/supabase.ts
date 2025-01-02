'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL o Anon Key no configuradas:', { SUPABASE_URL, SUPABASE_ANON_KEY })
  throw new Error('Configuración de Supabase incompleta')
}

export const createClient = () => {
  console.log('Inicializando cliente Supabase con URL:', SUPABASE_URL)
  return createClientComponentClient<Database>({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
  })
}

export const supabase = createClient() 