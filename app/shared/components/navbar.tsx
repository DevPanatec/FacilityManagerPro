'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { COMPANY_LOGO } from '../../config/brandConfig';

type UserRole = 'superadmin' | 'admin' | 'enterprise' | 'usuario';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type NavItems = {
  [K in UserRole]: NavItem[];
};

// Configuración de rutas por rol
const NAV_ITEMS: NavItems = {
  superadmin: [
    { 
      label: 'Panel Principal',
      href: '/superadmin/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    { 
      label: 'Recursos Humanos',
      href: '/shared/rrhh',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    { 
      label: 'Inventario',
      href: '/shared/inventory',
      icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    },
    { 
      label: 'Calendario',
      href: '/shared/schedule',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    { 
      label: 'Reportes',
      href: '/shared/contingencyReport',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    }
  ],
  admin: [
    { 
      label: 'Panel Principal',
      href: '/admin/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    { 
      label: 'Asignaciones',
      href: '/admin/assignments',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    { 
      label: 'Tareas',
      href: '/admin/tasks',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    { 
      label: 'Recursos Humanos',
      href: '/shared/rrhh',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    { 
      label: 'Reporte',
      href: '/shared/contingencyReport',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    { 
      label: 'Inventario',
      href: '/shared/inventory',
      icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    },
    { 
      label: 'Calendario',
      href: '/shared/schedule',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    }
  ],
  enterprise: [
    { 
      label: 'Panel Principal',
      href: '/enterprise/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    { 
      label: 'Calendario',
      href: '/shared/schedule',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    { 
      label: 'Recursos Humanos',
      href: '/shared/rrhh',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    { 
      label: 'Inventario',
      href: '/shared/inventory',
      icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    }
  ],
  usuario: [
    { 
      label: 'Usuario',
      href: '/user/usuario',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    { 
      label: 'Tarea Actual',
      href: '/user/currentTask',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    { 
      label: 'Historial',
      href: '/user/taskHistory',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    { 
      label: 'Reportes',
      href: '/user/reports',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    }
  ]
};

interface NavbarProps {
  role?: string;
  isEnterprise?: boolean;
  organizationName?: string;
}

export default function Navbar({ role = '', isEnterprise = false, organizationName }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole>((role || 'enterprise') as UserRole);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole.toLowerCase() as UserRole);
    } else if (isEnterprise) {
      setUserRole('enterprise');
    }
  }, [role, isEnterprise]);

  // Si isEnterprise es true, forzamos el rol enterprise
  const effectiveRole = (isEnterprise ? 'enterprise' : userRole) as UserRole;
  const navItems = NAV_ITEMS[effectiveRole] || [];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/auth/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-1 px-4">
        {/* Logo y nombre */}
        <div className="flex items-center space-x-3">
          {isEnterprise ? (
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">
              {organizationName || 'Mi Organización'}
            </h1>
          ) : (
            <>
              <div className="p-1 bg-white rounded-lg shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Logo Marpes"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">
                Hombres de Blanco
              </h1>
            </>
          )}
        </div>

        {/* Navegación principal */}
        <nav className="hidden lg:flex flex-1 justify-center px-10">
          <div className="flex items-center space-x-3">
            {navItems && navItems.length > 0 ? (
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${pathname === item.href 
                      ? 'bg-blue-800 text-white' 
                      : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                    }
                  `}
                >
                  <svg 
                    className={`w-4 h-4 ${pathname === item.href ? 'text-white' : 'text-blue-200 group-hover:text-white'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={item.icon}
                    />
                  </svg>
                  <span>{item.label}</span>
                </Link>
              ))
            ) : (
              <div className="text-white">No hay elementos de navegación disponibles</div>
            )}
          </div>
        </nav>

        {/* Botón de cerrar sesión */}
        <div className="flex items-center">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg 
                      text-blue-100 hover:bg-blue-800/50 hover:text-white
                      transition-all duration-200"
            title="Cerrar Sesión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
} 