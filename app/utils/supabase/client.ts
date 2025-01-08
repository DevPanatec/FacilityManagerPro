'use client'

import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Export a singleton instance for use in components
export const supabase = createClient()

// Helper functions
export async function getProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user found')

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function updateProfile(updates: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user found')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error:', error)
    return null
  }
} 
