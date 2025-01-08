import { createClient } from '@/utils/supabase/server'

export default async function TestSupabase() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Supabase Test</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify({ session }, null, 2)}
      </pre>
    </div>
  )
} 
