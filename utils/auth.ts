import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = createClientComponentClient<Database>()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function signOut() {
  const supabase = createClientComponentClient<Database>()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/auth/login')
  }
  return session
}

export async function getUserProfile() {
  const session = await getSession()
  if (!session) return null

  const supabase = createClientComponentClient<Database>()
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) throw error
    return profile
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function getOrganization(organizationId: string) {
  if (!organizationId) return null
  
  const supabase = createClientComponentClient<Database>()
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
      
    if (error) throw error
    return organization
  } catch (error) {
    console.error('Error getting organization:', error)
    return null
  }
} 