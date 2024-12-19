'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ALLOWED_ROUTES = {
  usuario: [
    '/user', 
    '/user/usuario',
    '/user/currentTask',
    '/user/taskHistory',
    '/user/reports'
  ],
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/assignments',
    '/shared/rrhh',
    '/shared/contingencyReport',
    '/shared/inventory',
    '/shared/schedule'
  ],
  enterprise: [
    '/enterprise',
    '/enterprise/dashboard',
    '/shared/rrhh',
    '/shared/inventory',
    '/shared/schedule'
  ]
};

const INITIAL_ROUTES = {
  usuario: '/user/usuario',
  admin: '/admin/dashboard',
  enterprise: '/enterprise/dashboard'
};

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/auth/login') {
      return;
    }

    const userRole = localStorage.getItem('userRole');
    
    if (!userRole) {
      router.push('/auth/login');
      return;
    }

    const allowedRoutes = ALLOWED_ROUTES[userRole as keyof typeof ALLOWED_ROUTES];
    if (!allowedRoutes?.some(route => pathname.startsWith(route))) {
      router.push(INITIAL_ROUTES[userRole as keyof typeof INITIAL_ROUTES]);
    }
  }, [pathname, router]);

  return <>{children}</>;
}
