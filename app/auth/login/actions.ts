'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: { session }, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    throw new Error('Email o contraseña incorrectos')
  }

  if (!session?.user) {
    throw new Error('No se pudo obtener la información del usuario')
  }

  // Get user role for routing
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = userData?.role || 'usuario'
  let targetPath = '/user/usuario'
  
  if (role === 'admin' || role === 'superadmin') {
    targetPath = '/admin/dashboard'
  } else if (role === 'enterprise') {
    targetPath = '/enterprise/dashboard'
  }

  revalidatePath('/', 'layout')
  redirect(targetPath)
}