import { createClient } from '../../../utils/supabase/server'
import { z } from 'zod'
import { signupSchema } from '../../../lib/validations/auth'

export async function signup(formData: FormData) {
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
    }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  return { success: true }
} 