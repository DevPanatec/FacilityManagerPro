'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Navbar from '../shared/componentes/navbar'
import ChatWidget from '../shared/componentes/ChatWidget'

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState('enterprise')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const userRole = user?.user_metadata?.role

      if (!userRole || userRole !== 'enterprise') {
        router.push('/auth/login')
      } else {
        setRole(userRole)
        localStorage.setItem('userRole', userRole)
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar role="enterprise" isEnterprise={true} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
      <ChatWidget 
        isAdmin={false}
        isAdminPrincipal={false}
      />
    </div>
  )
}