'use server'

import { createClient } from '@/app/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logout(): Promise<{ success: boolean, error?: string }> {
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
    
    // Registrar el logout en activity_logs
    const session = await supabase.auth.getSession()
    if (session.data.session?.user) {
      await supabase.from('activity_logs').insert({
        user_id: session.data.session.user.id,
        action: 'logout',
        description: 'User logged out successfully'
      })
    }

    revalidatePath('/', 'layout')
    redirect('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: 'Error al cerrar sesión'
    }
  }
} 
