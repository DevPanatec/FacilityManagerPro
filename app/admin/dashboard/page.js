'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('dia');
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false);
  
  useEffect(() => {
    const adminPrincipal = localStorage.getItem('adminPrincipal');
    setIsAdminPrincipal(!!adminPrincipal);
  }, []);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Personal Activo</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-green-600">
              {stats.personalActivo}
            </p>
            <p className="text-sm text-gray-500 mt-1">empleados</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Áreas Activas</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-purple-600">
              {stats.areasActivas}
            </p>
            <p className="text-sm text-gray-500 mt-1">áreas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800">Inventario Total</h3>
          <div className="mt-2">
            <p className="text-3xl font-bold text-orange-600">
              {stats.inventarioTotal}
            </p>
            <p className="text-sm text-gray-500 mt-1">items</p>
          </div>
        </div>
      </div>
    </div>
  );
} 