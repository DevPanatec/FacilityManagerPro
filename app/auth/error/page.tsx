export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Error de Autenticación
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ha ocurrido un error durante el proceso de autenticación. Por favor, intenta nuevamente.
          </p>
          <div className="mt-5 text-center">
            <a
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 