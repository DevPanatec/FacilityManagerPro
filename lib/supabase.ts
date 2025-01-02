'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL o Anon Key no configuradas:', { SUPABASE_URL, SUPABASE_ANON_KEY })
  throw new Error('Configuración de Supabase incompleta')
}

// Validar formato de URL
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('URL de Supabase inválida:', SUPABASE_URL)
  throw new Error('La URL de Supabase debe comenzar con https://')
}

// Validar que la anon key tenga el formato correcto
if (!SUPABASE_ANON_KEY.startsWith('eyJ') || SUPABASE_ANON_KEY.length < 100) {
  console.error('Anon Key de Supabase inválida:', SUPABASE_ANON_KEY)
  throw new Error('La Anon Key de Supabase no tiene el formato correcto')
}

export const createClient = () => {
  console.log('Inicializando cliente Supabase con:', {
    url: SUPABASE_URL,
    keyLength: SUPABASE_ANON_KEY.length
  })
  
  const client = createClientComponentClient<Database>({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  })

  // Verificar que el cliente se creó correctamente
  if (!client || !client.auth) {
    throw new Error('Error al crear el cliente de Supabase')
  }

  return client
}

export const supabase = createClient() 