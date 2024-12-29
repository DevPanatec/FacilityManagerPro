'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 min-h-screen bg-gray-800">
      <nav className="mt-5 px-2">
        <Link 
          href="/admin/dashboard"
          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
            isActive('/admin/dashboard')
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Dashboard
        </Link>
        <Link 
          href="/admin/assignments"
          className={`mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md ${
            isActive('/admin/assignments')
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Asignaciones
        </Link>
        <Link 
          href="/admin/webhooks"
          className={`mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md ${
            isActive('/admin/webhooks')
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Webhooks
        </Link>
        <Link 
          href="/admin/audit"
          className={`mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md ${
            isActive('/admin/audit')
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Auditoría
        </Link>
      </nav>
    </div>
  );
} 