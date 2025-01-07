'use server'

import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/lib/validations/auth'
import { AuthError } from '@/types/auth'

export async function login(formData: FormData) {
  try {
    // Validar datos
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    const { email, password } = validatedFields.data
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    redirect('/protected')
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Error desconocido'
    } as AuthError
  }
}
