import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SignUpPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/protected')
  }

  return (
    <div>
      <h1>Sign Up</h1>
      {/* Formulario de registro */}
    </div>
  )
} 
