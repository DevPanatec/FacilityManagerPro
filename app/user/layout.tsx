'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../shared/components/navbar'
import ChatWidget from '@/app/shared/components/ChatWidget'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/auth/login')
      return
    }
    
    if (userRole !== 'usuario') {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}