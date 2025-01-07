'use server'

import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyEmail(token: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email'
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
} 
