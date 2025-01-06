'use client'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import ChatWidget from '../shared/componentes/ChatWidget'

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole || userRole !== 'enterprise') {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar isEnterprise={true} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
      <ChatWidget 
        isEnterprise={true}
        onNewMessage={(message) => {
          console.log('Nuevo mensaje:', message)
        }}
      />
    </div>
  )
}