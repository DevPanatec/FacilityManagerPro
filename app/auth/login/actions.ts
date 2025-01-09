'use server'

import { cookies } from 'next/headers'
import { createClient } from '../../../utils/supabase/server'
import { loginSchema } from '../../../lib/validations/auth'
import type { AuthResponse } from '../../../types/auth'

export async function login(formData: FormData): Promise<AuthResponse> {
  try {
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validatedFields.success) {
      return {
        error: {
          message: validatedFields.error.errors[0].message,
          status: 400
        }
      }
    }

    const { email, password } = validatedFields.data

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        error: {
          message: error.message,
          status: error.status || 400
        }
      }
    }

    // Ensure session is properly set
    if (!data?.session) {
      return {
        error: {
          message: 'Authentication failed',
          status: 401
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: {
        message: 'An unexpected error occurred',
        status: 500
      }
    }
  }
}
