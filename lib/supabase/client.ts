'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Validar variables de entorno
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
    keyLength: SUPABASE_ANON_KEY.length,
    timestamp: new Date().toISOString()
  })
  
  const client = createClientComponentClient<Database>({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
    cookieOptions: {
      name: 'sb-session',
      path: '/',
      sameSite: 'lax'
    }
  })

  // Verificar que el cliente se creó correctamente
  if (!client || !client.auth) {
    throw new Error('Error al crear el cliente de Supabase')
  }

  // Agregar listener para cambios de autenticación
  client.auth.onAuthStateChange((event, session) => {
    console.log('Cambio de estado de autenticación:', {
      event,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    })
  })

  return client
}

// Cliente singleton para uso general
export const supabase = createClient() 