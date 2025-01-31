import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Cliente singleton para uso en servicios
export const supabase = createClient() 