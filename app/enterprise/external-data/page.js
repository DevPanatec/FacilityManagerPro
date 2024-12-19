'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExternalDataPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Datos Externos
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Funcionalidad no implementada
          </p>
        </div>
      </div>
    </div>
  );
} 