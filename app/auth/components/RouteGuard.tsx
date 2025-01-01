'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Función para verificar la autorización
    const authCheck = () => {
      // Obtener el rol del usuario del localStorage
      if (typeof window !== 'undefined') {
        const userRole = localStorage.getItem('userRole');
        
        // Lista de rutas públicas que no requieren autenticación
        const publicPaths = ['/auth/login'];
        const isPublicPath = pathname ? publicPaths.includes(pathname) : false;

        if (!userRole && !isPublicPath) {
          setAuthorized(false);
          router.push('/auth/login');
        } else {
          setAuthorized(true);
        }
      }
    };

    // Verificar cuando la ruta cambia
    authCheck();
  }, [pathname, router]);

  return authorized ? <>{children}</> : null;
} 