'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createClientComponentClient()
}

// Cliente singleton para uso en servicios
export const supabase = createClient() 