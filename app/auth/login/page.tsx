import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoginLoading from './loading'

const LoginForm = dynamic(() => import('./components/LoginForm'), {
  loading: () => <LoginLoading />,
  ssr: false
})

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
} 