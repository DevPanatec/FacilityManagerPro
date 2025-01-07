'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const returnTo = searchParams.get('returnTo')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Error de Autenticación</h1>
      <p className="text-red-500 mb-4">{error || 'Ha ocurrido un error inesperado'}</p>
      <div className="flex gap-4">
        <Link 
          href="/auth/login"
          className="text-blue-500 hover:underline"
        >
          Volver al login
        </Link>
        {returnTo && (
          <Link 
            href={decodeURIComponent(returnTo)}
            className="text-blue-500 hover:underline"
          >
            Volver a la página anterior
          </Link>
        )}
      </div>
    </div>
  )
} 
