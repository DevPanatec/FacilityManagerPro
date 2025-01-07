'use server'

import { createClient } from '@/app/utils/supabase/server'

interface ResetPasswordResponse {
  success: boolean
  error?: string
  code?: string
}

export async function requestPasswordReset(formData: FormData): Promise<ResetPasswordResponse> {
  const supabase = createClient()
  const email = formData.get('email')?.toString().trim()

  if (!email) {
    return {
      success: false,
      error: 'Email es requerido',
      code: 'RESET_MISSING_EMAIL'
    }
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
    })

    if (error) throw error

    return {
      success: true
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Error al enviar el email de recuperación',
      code: 'RESET_ERROR'
    }
  }
} 
