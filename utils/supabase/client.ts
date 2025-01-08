import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const createClient = () => {
  return createClientComponentClient()
} 