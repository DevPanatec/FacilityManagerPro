import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="rounded-lg border border-border p-8">
      <p className="text-foreground">
        This is a protected page. You can only see this if you are authenticated.
      </p>
    </div>
  )
} 
