import { createClient } from '@/app/config/supabaseServer'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
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

  const supabase = createClient()
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

export async function getOrganization() {
  const profile = await getUserProfile()
  if (!profile?.organization_id) return null

  const supabase = createClient()
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    if (error) throw error
    return organization
  } catch (error) {
    console.error('Error:', error)
    return null
  }
} 