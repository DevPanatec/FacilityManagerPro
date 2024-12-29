'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth/authService';

export default function Verify2FAPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const authService = new AuthService();

  const handleVerify = async () => {
    try {
      // Obtener userId de la sesión temporal
      const userId = sessionStorage.getItem('temp_user_id');
      if (!userId) {
        setError('Sesión inválida');
        return;
      }

      const isValid = await authService.verify2FA(userId, code);
      if (isValid) {
        router.push('/dashboard'); // O tu ruta principal
      } else {
        setError('Código inválido');
      }
    } catch (error) {
      setError('Error al verificar el código');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Verificación de dos factores
        </h2>
        
        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="code" className="sr-only">
              Código de verificación
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Ingresa el código de 6 dígitos"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
} 