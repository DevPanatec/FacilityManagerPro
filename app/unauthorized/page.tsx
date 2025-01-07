export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">No Autorizado</h1>
      <p className="mt-4">No tienes permisos para acceder a esta página.</p>
      <a href="/auth/login" className="mt-4 text-blue-500 hover:underline">
        Volver al inicio
      </a>
    </div>
  )
} 
