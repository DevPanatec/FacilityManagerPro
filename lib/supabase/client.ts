'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

export const supabase = createClientComponentClient<Database>({
  cookieOptions: {
    name: 'sb-session',
    path: '/',
    sameSite: 'lax'
  }
}) 