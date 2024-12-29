'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/admin/assignments"
                className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Panel de Administración
              </Link>
              <Link href="/webhooks" className="text-gray-600 hover:text-gray-900">
                Webhooks
              </Link>
              <Link href="/audit" className="text-gray-600 hover:text-gray-900">
                Auditoría
              </Link>
              {session?.user.role === 'admin' && (
                <Link 
                  href="/security-dashboard" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Panel de Seguridad
                </Link>
              )}
              {/* Agrega más enlaces según necesites */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 