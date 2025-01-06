'use server'

import { redirect } from 'next/navigation'
import { verifyCredentials, getRedirectPath } from '../../utils/auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = verifyCredentials(email, password)

  if (!user) {
    throw new Error('Credenciales inválidas')
  }

  const targetPath = getRedirectPath(user.role)
  return { success: true, user, targetPath }
}