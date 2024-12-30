'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/auth/login')
      return
    }

    switch(userRole) {
      case 'admin':
        router.push('/admin/dashboard')
        break
      case 'enterprise':
        router.push('/enterprise/dashboard')
        break
      case 'usuario':
        router.push('/user/usuario')
        break
      default:
        router.push('/auth/login')
    }
  }, [router])

  return null
}
