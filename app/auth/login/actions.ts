'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  try {
    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key instead of anon key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      throw error
    }

    if (!session) {
      throw new Error('Authentication failed')
    }

    // Get user role from metadata
    const role = session.user.user_metadata.role || 'usuario'
    
    // Determine redirect path based on role
    let targetPath = '/user/dashboard'
    if (role === 'admin' || role === 'superadmin') {
      targetPath = '/admin/dashboard'
    } else if (role === 'enterprise') {
      targetPath = '/enterprise/dashboard'
    }

    revalidatePath('/', 'layout')
    redirect(targetPath)
    
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}