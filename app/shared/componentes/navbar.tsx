'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { COMPANY_LOGO } from '../../config/brandConfig';

// Configuración de rutas por rol
const NAV_ITEMS = {
  usuario: [
    { label: 'Usuario', href: '/user/usuario' },
    { label: 'Tarea Actual', href: '/user/currentTask' },
    { label: 'Historial', href: '/user/taskHistory' },
    { label: 'Reportes', href: '/user/reports' }
  ],
  admin: [
    { label: 'Panel Principal', href: '/admin/dashboard' },
    { label: 'Asignaciones', href: '/admin/assignments' },
    { label: 'Recursos Humanos', href: '/shared/rrhh' },
    { label: 'Reporte', href: '/shared/contingencyReport' },
    { label: 'Inventario', href: '/shared/inventory' },
    { label: 'Calendario', href: '/shared/schedule' }
  ],
  enterprise: [
    { label: 'Panel Principal', href: '/enterprise/dashboard' },
    { label: 'Calendario', href: '/shared/schedule' },
    { label: 'Recursos Humanos', href: '/shared/rrhh' },
    { label: 'Inventario', href: '/shared/inventory' },
    { label: 'Centro de Datos', href: '/enterprise/data-hub' }
  ]
};

export default function Navbar({ isEnterprise = false }) {
  const router = useRouter()
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setUserRole(role);
    }
  }, []);

  const navItems = NAV_ITEMS[userRole] || [];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/auth/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center space-x-3 w-72">
          <div className="p-1.5 bg-white rounded-lg shadow-md">
            {isEnterprise ? (
              <Image
                src={COMPANY_LOGO}
                alt="Marpesca Logo"
                width={160}
                height={55}
                className="object-contain"
                priority
              />
            ) : (
              <Image
                src="/logo.jpg"
                alt="Logo Marpes"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            )}
          </div>
          {!isEnterprise && (
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">
              Hombres de Blanco
            </h1>
          )}
        </div>

        <nav className="hidden md:flex items-center space-x-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
                ${pathname === item.href ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'} transition-all duration-200`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <div className="h-6 w-px bg-blue-400/50 mx-4 hidden md:block"></div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg 
                      text-blue-100 hover:bg-blue-800/50 hover:text-white
                      transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden md:inline text-sm font-medium">
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </header>
  )
} 