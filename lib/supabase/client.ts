'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Validar variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error de configuración:', { 
    url: SUPABASE_URL ? 'configurada' : 'falta',
    key: SUPABASE_ANON_KEY ? 'configurada' : 'falta'
  })
  throw new Error('Las credenciales de Supabase no están configuradas correctamente')
}

// Validar formato de URL
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('URL de Supabase inválida:', SUPABASE_URL)
  throw new Error('La URL de Supabase debe comenzar con https://')
}

// Validar que la anon key tenga el formato correcto
if (!SUPABASE_ANON_KEY.startsWith('eyJ') || SUPABASE_ANON_KEY.length < 100) {
  console.error('Anon Key de Supabase inválida')
  throw new Error('La Anon Key de Supabase no tiene el formato correcto')
}

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    console.log('Inicializando cliente Supabase...', {
      timestamp: new Date().toISOString()
    })
    
    supabaseInstance = createClientComponentClient<Database>({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    })

    // Verificar que el cliente se creó correctamente
    if (!supabaseInstance || !supabaseInstance.auth) {
      throw new Error('Error al crear el cliente de Supabase')
    }

    // Agregar listener para cambios de autenticación
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('Cambio de estado de autenticación:', {
        event,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      })
    })

    return supabaseInstance
  } catch (error) {
    console.error('Error al inicializar Supabase:', error)
    throw new Error('No se pudo inicializar la conexión con Supabase')
  }
}

// Cliente singleton para uso general
export const supabase = createClient()

// Función para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error de conexión con Supabase:', error)
    return false
  }
} 