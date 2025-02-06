'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY, baseAuthConfig, baseGlobalConfig } from './config.base'

// Cliente para componentes del lado del cliente
export const createClientSupabase = () => {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      ...baseAuthConfig,
      ...baseGlobalConfig,
      auth: {
        ...baseAuthConfig.auth,
        storageKey: 'facility-manager-auth',
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              return localStorage.getItem(key)
            } catch (error) {
              console.error('Error accessing localStorage:', error)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value)
            } catch (error) {
              console.error('Error setting localStorage:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.error('Error removing from localStorage:', error)
            }
          },
        } : undefined,
      },
    }
  )
}

// Instancia del cliente para uso general en el lado del cliente
export const supabase = createClientSupabase() 