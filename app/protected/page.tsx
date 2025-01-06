import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.error('Error fetching user data:', userError)
  }

  return (
    <div className="p-4">
      <h1>Protected Page</h1>
      <p>Email: {user.email}</p>
      <p>Role: {userData?.role || 'N/A'}</p>
    </div>
  )
} 