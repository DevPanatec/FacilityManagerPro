import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Verificar que el usuario sea admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <div className="mt-4">
            <p className="text-gray-600">
              Bienvenido al panel de administración
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 