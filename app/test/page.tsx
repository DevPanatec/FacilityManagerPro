import TestSupabase from '../components/TestSupabase'
import TestLogin from '../components/TestLogin'

export default function TestPage() {
  return (
    <div className="flex-1 flex flex-col gap-4 w-full px-8 sm:max-w-md justify-center">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <TestSupabase />
      <TestLogin />
    </div>
  )
} 
