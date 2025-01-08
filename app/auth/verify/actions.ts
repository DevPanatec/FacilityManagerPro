'use server'

import { createClient } from '../../../utils/supabase/server'

export async function verify(formData: FormData) {
  const token = formData.get('token') as string
  const email = formData.get('email') as string

  if (!token || !email) {
    return {
      error: 'Missing token or email',
    }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.verifyOtp({
    token,
    type: 'email',
    email,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  return { success: true }
} 
