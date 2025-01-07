import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token
  if (!token) redirect('/auth/login')

  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email'
  })

  if (error) {
    redirect('/auth/error?message=' + error.message)
  }

  redirect('/auth/login?verified=true')
} 
