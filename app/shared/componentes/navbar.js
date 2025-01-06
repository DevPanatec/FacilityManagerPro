'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar({ isEnterprise = false }) {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {isEnterprise ? (
                <Link
                  href="/enterprise/dashboard"
                  title=""
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/assignments"
                  title=""
                  className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Asignaciones
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