'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('dia');
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.replace('/auth/login');
        return;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        router.replace('/auth/login');
        return;
      }

      setIsAdminPrincipal(true);
    };

    checkAuth();
  }, [router]);
  
  // Estadísticas generales del sistema
  const stats = {
    asignacionesPendientes: {
      dia: {
        cantidad: 24,
        variacion: 12
      },
      semana: {
        cantidad: 156,
        variacion: 8
      },
      mes: {
        cantidad: 580,
        variacion: 15
      }
    },
    personalActivo: 45,
    areasActivas: 8,
    inventarioTotal: 1234
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Selector de período */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedPeriod('dia')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'dia'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setSelectedPeriod('semana')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'semana'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setSelectedPeriod('mes')}
          className={`px-4 py-2 rounded-lg ${
            selectedPeriod === 'mes'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Este Mes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Asignaciones Pendientes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Asignaciones Pendientes</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-blue-600">
              {stats.asignacionesPendientes[selectedPeriod].cantidad}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedPeriod === 'dia' ? 'Hoy' : 
               selectedPeriod === 'semana' ? 'Esta semana' : 
               'Este mes'}
            </p>
            <div className="flex items-center mt-2">
              <span className={`text-sm ${
                stats.asignacionesPendientes[selectedPeriod].variacion > 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {stats.asignacionesPendientes[selectedPeriod].variacion}% vs periodo anterior
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Personal Activo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Personal Activo</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-green-600">
              {stats.personalActivo}
            </p>
            <p className="text-sm text-gray-500 mt-1">empleados</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-green-500">
                +5% vs mes anterior
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Áreas Activas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Áreas Activas</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-purple-600">
              {stats.areasActivas}
            </p>
            <p className="text-sm text-gray-500 mt-1">áreas</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-purple-500">
                100% operativas
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Inventario Total */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Inventario Total</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-orange-600">
              {stats.inventarioTotal}
            </p>
            <p className="text-sm text-gray-500 mt-1">items</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-orange-500">
                +12 nuevos items
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 