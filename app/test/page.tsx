import { Suspense } from 'react'
import TestSupabase from '@/app/components/TestSupabase'
import TestLogin from '@/app/components/TestLogin'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Test Components</h1>
        
        <div className="space-y-8">
          <Suspense fallback={<div>Loading Supabase test...</div>}>
            <TestSupabase />
          </Suspense>

          <Suspense fallback={<div>Loading Login test...</div>}>
            <TestLogin />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 
