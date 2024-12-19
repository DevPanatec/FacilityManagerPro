'use client';
import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('dia');
  const [hoveredArea, setHoveredArea] = useState(null);
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false);
  const router = useRouter();
  
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

  // Datos de ejemplo para el inventario
  const inventarioStats = {
    Desinfectante: {
      total: 150,
      bajoStock: 3,
      porcentaje: 45
    },
    Detergentes: {
      total: 200,
      bajoStock: 5,
      porcentaje: 60
    },
    Implementos: {
      total: 100,
      bajoStock: 2,
      porcentaje: 35
    }
  };

  // Datos para las estadísticas de asignaciones
  const asignacionesStats = {
    semanal: [
      { dia: 'Lun', completadas: 12, pendientes: 3 },
      { dia: 'Mar', completadas: 15, pendientes: 4 },
      { dia: 'Mie', completadas: 8, pendientes: 6 },
      { dia: 'Jue', completadas: 14, pendientes: 2 },
      { dia: 'Vie', completadas: 10, pendientes: 5 }
    ],
    rendimientoPorArea: {
      'Área de Emergencias': 92,
      'Área de Consultas': 88,
      'Área de Laboratorio': 95,
      'Área de Farmacia': 85
    }
  };

  // Modificar los datos para incluir diferentes períodos
  const statsAdicionales = {
    dia: {
      tiempoPromedioTarea: '45min',
      tasaCompletitud: 87,
      incidentesPendientes: 3,
      equiposMantenimiento: 5
    },
    semana: {
      tiempoPromedioTarea: '38min',
      tasaCompletitud: 92,
      incidentesPendientes: 12,
      equiposMantenimiento: 18
    },
    mes: {
      tiempoPromedioTarea: '42min',
      tasaCompletitud: 85,
      incidentesPendientes: 45,
      equiposMantenimiento: 72
    }
  };

  // Datos para el análisis de inventario
  const inventarioTendencias = [
    { mes: 'Ene', consumo: 245, reposicion: 200 },
    { mes: 'Feb', consumo: 320, reposicion: 280 },
    { mes: 'Mar', consumo: 280, reposicion: 300 },
    { mes: 'Abr', consumo: 290, reposicion: 270 },
    { mes: 'May', consumo: 310, reposicion: 320 }
  ];

  // Datos de productividad por turno
  const productividadTurnos = {
    mañana: { completadas: 45, eficiencia: 92 },
    tarde: { completadas: 38, eficiencia: 88 },
    noche: { completadas: 28, eficiencia: 85 }
  };

  // Modificar las tarjetas para usar el período seleccionado
  const frecuenciaLimpieza = {
    dia: {
      'Área de Baños': {
        frecuencia: 8,
        total: 10,
        porcentaje: 80
      },
      'Área de Oficinas': {
        frecuencia: 5,
        total: 10,
        porcentaje: 50
      },
      'Área de Comedor': {
        frecuencia: 6,
        total: 10,
        porcentaje: 60
      },
      'Área de Vestidores': {
        frecuencia: 4,
        total: 10,
        porcentaje: 40
      }
    },
    semana: {
      'Área de Baños': {
        frecuencia: 85,
        total: 100,
        porcentaje: 85
      },
      'Área de Oficinas': {
        frecuencia: 60,
        total: 100,
        porcentaje: 60
      },
      'Área de Comedor': {
        frecuencia: 70,
        total: 100,
        porcentaje: 70
      },
      'Área de Vestidores': {
        frecuencia: 40,
        total: 100,
        porcentaje: 40
      }
    },
    mes: {
      'Área de Baños': {
        frecuencia: 340,
        total: 400,
        porcentaje: 85
      },
      'Área de Oficinas': {
        frecuencia: 280,
        total: 400,
        porcentaje: 70
      },
      'Área de Comedor': {
        frecuencia: 320,
        total: 400,
        porcentaje: 80
      },
      'Área de Vestidores': {
        frecuencia: 240,
        total: 400,
        porcentaje: 60
      }
    }
  };

  // Datos de inventario crítico
  const inventarioCritico = [
    { 
      id: 1, 
      nombre: 'Papel Higiénico Industrial', 
      stock: 150, 
      minimo: 200,
      area: 'Baños',
      ultimoUso: '2024-02-20',
      estado: 'critico'
    },
    { 
      id: 2, 
      nombre: 'Jabón Líquido', 
      stock: 80, 
      minimo: 100,
      area: 'General',
      ultimoUso: '2024-02-19',
      estado: 'advertencia'
    },
    { 
      id: 3, 
      nombre: 'Bolsas de Basura', 
      stock: 50, 
      minimo: 100,
      area: 'General',
      ultimoUso: '2024-02-21',
      estado: 'critico'
    },
    { 
      id: 4, 
      nombre: 'Desinfectante de Pisos', 
      stock: 120, 
      minimo: 150,
      area: 'General',
      ultimoUso: '2024-02-18',
      estado: 'advertencia'
    },
    { 
      id: 5, 
      nombre: 'Escobas', 
      stock: 45, 
      minimo: 100,
      area: 'Almacén',
      ultimoUso: '2024-02-20',
      estado: 'critico'
    },
    { 
      id: 6, 
      nombre: 'Toallas de Papel', 
      stock: 85, 
      minimo: 100,
      area: 'Baños',
      ultimoUso: '2024-02-17',
      estado: 'advertencia'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 px-6 py-8 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <p className="text-blue-100 mt-1">Resumen general del sistema</p>
          </div>
          <div className="flex gap-2">
            {['dia', 'semana', 'mes'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedPeriod === period 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700/50 text-white hover:bg-blue-700'}`}
              >
                {period === 'dia' ? 'Día' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas con mejor diseño */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Asignaciones Pendientes</h2>
              <p className="text-3xl font-bold text-gray-900">
                {stats.asignacionesPendientes[selectedPeriod].cantidad}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.asignacionesPendientes[selectedPeriod].variacion}% vs {selectedPeriod === 'dia' ? 'ayer' : 
                  selectedPeriod === 'semana' ? 'semana anterior' : 'mes anterior'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full hover:bg-green-200 transition-colors">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Personal Activo</h2>
              <p className="text-3xl font-bold text-gray-900">{stats.personalActivo}</p>
              <p className="text-xs text-green-600 mt-1">Personal actual en turno</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Tiempo Promedio</h2>
              <p className="text-3xl font-bold text-gray-900">{statsAdicionales[selectedPeriod].tiempoPromedioTarea}</p>
              <p className="text-xs text-purple-600 mt-1">Por tarea completada</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Eficiencia Global</h2>
              <p className="text-3xl font-bold text-gray-900">{statsAdicionales[selectedPeriod].tasaCompletitud}%</p>
              <p className="text-xs text-yellow-600 mt-1">Tasa de completitud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y paneles con mejor diseño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Productividad por Turno */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Productividad por Turno</h3>
          </div>
          <div className="p-6">
            {Object.entries(productividadTurnos).map(([turno, datos]) => (
              <div key={turno} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="capitalize text-gray-700">{turno}</span>
                  <span className="text-sm font-medium text-blue-600">
                    {datos.completadas} tareas
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="flex-grow h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${datos.eficiencia}%` }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm text-gray-600">{datos.eficiencia}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Alertas de Inventario - Removido col-span-2 */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Alertas de Inventario</h3>
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                {Object.values(inventarioStats).reduce((acc, curr) => acc + curr.bajoStock, 0)} items en bajo stock
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {Object.entries(inventarioStats).map(([categoria, stats]) => (
                stats.bajoStock > 0 && (
                  <div 
                    key={categoria}
                    className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all">
                          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {categoria.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {stats.bajoStock} items necesitan reposición
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Stock actual: {stats.total}
                        </div>
                        <div className="text-xs text-red-600">
                          Mínimo requerido: {Math.floor(stats.total * 0.2)}
                        </div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-300"
                        style={{ 
                          width: `${(stats.bajoStock / stats.total) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        Ver detalles →
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => router.push('/shared/inventory')}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 hover:bg-blue-100 
                         text-blue-600 font-medium rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ver Inventario Completo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paneles principales con más interactividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Asignaciones con tabs */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Estado de Asignaciones</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-3 3m0 0h-3.75M12 9a3 3 0 113-3m0 0h3.75M9 12a3 3 0 11-3 3m0 0h-3.75M21 12a9 9 0 11-9 9m9-9a9 9 0 00-9-9z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-3 3m0 0h-3.75M12 9a3 3 0 113-3m0 0h3.75M9 12a3 3 0 11-3 3m0 0h-3.75M21 12a9 9 0 11-9 9m9-9a9 9 0 00-9-9z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={asignacionesStats.semanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '0.5rem',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="completadas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendientes" fill="#F87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Panel de Rendimiento por Área con hover effects */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Frecuencia de Limpieza por Área</h3>
            <p className="text-sm text-gray-500 mt-1">
              Áreas que requieren más atención de limpieza por {selectedPeriod}
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(frecuenciaLimpieza[selectedPeriod])
                .sort((a, b) => b[1].frecuencia - a[1].frecuencia)
                .map(([area, datos]) => (
                  <div 
                    key={area} 
                    className="hover:bg-gray-50 p-4 rounded-lg transition-colors"
                    onMouseEnter={() => setHoveredArea(area)}
                    onMouseLeave={() => setHoveredArea(null)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{area}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${
                          datos.porcentaje >= 70 ? 'text-red-600' :
                          datos.porcentaje >= 50 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {datos.frecuencia} veces/{selectedPeriod}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            hoveredArea === area ? 'bg-blue-600' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${datos.porcentaje}%`,
                            boxShadow: hoveredArea === area ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>Nivel de frecuencia</span>
                        <span>{datos.porcentaje}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 