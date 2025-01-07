'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      className="py-2 px-4 rounded-md bg-gray-900 text-white"
      onClick={handleSignOut}
    >
      Sign Out
    </button>
  )
} 
