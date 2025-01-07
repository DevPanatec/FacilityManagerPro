import { createClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/auth/login')
  }

  // Validar rol si es necesario
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Área Protegida</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Bienvenido, {user.email}</p>
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {JSON.stringify({ user }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 
