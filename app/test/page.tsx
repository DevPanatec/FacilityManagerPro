import TestSupabase from '@/components/TestSupabase'
import TestLogin from '@/components/TestLogin'

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Supabase Integration Tests</h1>
      <div className="grid gap-8">
        <TestSupabase />
        <TestLogin />
      </div>
    </div>
  )
} 