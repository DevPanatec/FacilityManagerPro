'use client'

import { redirect } from 'next/navigation'

export default function AuthError({
  searchParams,
}: {
  searchParams: { error: string; message: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <h1 className="text-2xl font-bold mb-4">Error de Autenticación</h1>
      <p className="text-red-500 mb-4">
        {searchParams.message || 'Ha ocurrido un error durante la autenticación.'}
      </p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => redirect('/login')}
      >
        Volver al inicio de sesión
      </button>
    </div>
  )
} 
