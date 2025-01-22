'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import SalaAreaSelector from '@/app/shared/componentes/SalaAreaSelector'

interface ContingencyFile {
  id: string;
  report_id: string;
  name: string;
  url: string;
  type: 'imagen' | 'documento';
  created_at: string;
}

interface ContingencyReport {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  type: string;
  area: string;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  organization: {
    id: string;
    name: string;
  };
}

interface FileWithPreview extends File {
  preview: string;
}

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState('dia');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSala, setSelectedSala] = useState<string | null>(null);
  const [contingencyType, setContingencyType] = useState('');
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContingencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ role: string; organization_id: string | null } | null>(null);

  // Estado para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estado para reportes y tipos de contingencia
  const [reportes, setReportes] = useState<ContingencyReport[]>([]);
  const tiposContingencia = [
    'Falla de Equipo',
    'Accidente Laboral',
    'Problema de Infraestructura',
    'Falla Eléctrica',
    'Fuga o Derrame',
    'Problema de Seguridad',
    'Emergencia Médica',
    'Otro'
  ];
  const [stats, setStats] = useState({ pendientes: 0, resueltos: 0, total: 0 });

  const supabase = createClientComponentClient();

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data: userData, error: orgError } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', user?.id)
          .single();
        if (orgError) throw orgError;

        setUserData(userData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar datos del usuario');
      }
    };

    loadUserData();
  }, []);

  // Cargar datos de reportes cuando cambie el filtro o la página
  useEffect(() => {
    if (userData) {
      loadData();
    }
  }, [timeFilter, page, userData]);

  const loadData = async () => {
    if (!userData) return; // Si no hay datos del usuario, no cargar nada

    try {
      setIsLoading(true);
      setError(null);

      // Calcular rango de fechas según el filtro
      const now = new Date();
      let startDate = new Date();
      if (timeFilter === 'dia') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'semana') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'mes') {
        startDate.setMonth(now.getMonth() - 1);
      }

      // Cargar reportes
      let reportsQuery = supabase
        .from('tasks')
        .select(`
          *,
          creator:users!tasks_created_by_fkey(id, first_name, last_name),
          area:areas(id, name)
        `, { count: 'exact' })
        .eq('priority', 'urgent')  // Usamos las contingencias como tareas urgentes
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);

      // Si no es superadmin, filtrar por organization_id
      if (userData.role !== 'superadmin') {
        if (!userData.organization_id) {
          throw new Error('Usuario no tiene organización asignada');
        }
        reportsQuery = reportsQuery.eq('organization_id', userData.organization_id);
      }

      const { data: reports, error: reportsError, count } = await reportsQuery;
      if (reportsError) throw reportsError;

      // Obtener todas las organizaciones (usuarios enterprise)
      const { data: organizations, error: orgsError } = await supabase
        .from('users')
        .select('id, organization_id, first_name, last_name')
        .eq('role', 'enterprise')
        .not('organization_id', 'is', null);

      if (orgsError) throw orgsError;

      // Crear un mapa de organizaciones para acceso más rápido
      const organizationsMap = new Map(
        organizations.map(org => [org.organization_id, {
          id: org.organization_id,
          name: `${org.first_name} ${org.last_name || ''}`.trim()
        }])
      );

      // Mapear los reportes con la información de la organización
      const reportsWithOrgs = reports?.map(report => ({
        id: report.id,
        title: report.title,
        description: report.description || '',
        date: report.created_at,
        status: report.status === 'completed' ? 'Completada' : 'Pendiente',
        type: contingencyType || 'No especificado',
        area: report.area?.name || 'No especificada',
        creator: report.creator,
        organization: organizationsMap.get(report.organization_id) || {
          id: report.organization_id,
          name: 'Organización Desconocida'
        }
      }));

      setReportes(reportsWithOrgs as ContingencyReport[]);
      setTotalPages(Math.ceil((count || 0) / 10));

      // Calcular estadísticas
      const pendientes = reports?.filter(r => r.status !== 'completed').length || 0;
      const resueltos = reports?.filter(r => r.status === 'completed').length || 0;
      setStats({
        pendientes,
        resueltos,
        total: pendientes + resueltos
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error instanceof Error ? error.message : 
        typeof error === 'object' && error !== null ? JSON.stringify(error, null, 2) : 
        'Error desconocido al cargar los datos');
      toast.error('Error al cargar los datos. Revisa la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userData?.organization_id) {
        throw new Error('Usuario no tiene organización asignada');
      }

      if (!selectedSala || !selectedArea) {
        toast.error('Por favor seleccione una sala y área');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('No se pudo obtener el usuario');

      const newReport = {
        title: `Reporte de Contingencia - ${contingencyType}`,
        description: description,
        priority: 'urgent',  // Las contingencias son siempre urgentes
        status: 'pending',
        sala_id: selectedSala,
        area_id: selectedArea,
        organization_id: userData.organization_id,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newReport])
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista de reportes
      await loadData();
      
      // Limpiar el formulario
      setContingencyType('');
      setSelectedSala(null);
      setSelectedArea('');
      setDescription('');

      toast.success('Reporte creado exitosamente');
    } catch (error) {
      console.error('Error al guardar el reporte:', error);
      toast.error('Error al guardar el reporte');
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus === 'Completada' ? 'completed' : 'pending' })
        .eq('id', reportId);

      if (error) throw error;

      await loadData();
      toast.success('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const renderReportModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Detalles del Reporte</h3>
            <div className="mt-2 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedReport.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Organización</p>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.organization.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Área</p>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.area}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo</p>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Creado por</p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReport.creator ? 
                    `${selectedReport.creator.first_name} ${selectedReport.creator.last_name}` : 
                    'Usuario desconocido'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportList = () => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    if (!reportes.length) {
      return <div>No hay reportes para mostrar</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organización
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportes.map((report) => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.organization.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.area}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Ver detalles
                  </button>
                  {report.status === 'Pendiente' ? (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'Completada')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Marcar como resuelto
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'Pendiente')}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Reabrir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header mejorado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Reportes de Contingencia
            </h1>
            <p className="mt-2 text-gray-600">Sistema de gestión y seguimiento de incidentes</p>
          </div>
          
          {/* Selector de período con diseño mejorado */}
          <div className="mt-4 md:mt-0">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border-2 border-blue-100 rounded-xl px-6 py-3 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 hover:border-blue-200 cursor-pointer
                        shadow-sm hover:shadow-md"
            >
              <option value="dia">Reportes de Hoy</option>
              <option value="semana">Reportes de la Semana</option>
              <option value="mes">Reportes del Mes</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de estadísticas con animación y mejor diseño */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total de Reportes */}
          <div className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Total Reportes</h2>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    {timeFilter === 'dia' ? 'Hoy' : 
                     timeFilter === 'semana' ? 'Esta Semana' : 
                     'Este Mes'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reportes Pendientes */}
          <div className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl hover:bg-yellow-200 transition-colors">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Pendientes</h2>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                    {stats.pendientes}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1 font-medium">Requieren atención</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reportes Resueltos */}
          <div className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Resueltos</h2>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    {stats.resueltos}
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">Completados</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor principal con diseño mejorado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tabla de Reportes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Encabezado mejorado */}
            <div className="bg-white p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <svg 
                      className="w-6 h-6 text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 4v16m6-8H6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-600">Crear Nuevo Reporte</h3>
                    <p className="text-gray-500 text-sm">Complete el formulario para registrar un nuevo reporte</p>
                  </div>
                </div>
              </div>
            </div>

            {renderReportList()}
          </div>

          {/* Formulario con diseño mejorado */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Encabezado mejorado */}
            <div className="bg-white p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Crear Nuevo Reporte</h3>
                  <p className="text-gray-500 text-sm">Complete el formulario para registrar un nuevo reporte</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSaveReport} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Sala y Área */}
                <SalaAreaSelector
                  onSalaChange={(sala) => setSelectedSala(sala?.id || null)}
                  onAreaChange={(area) => setSelectedArea(area?.id || '')}
                  className="space-y-4"
                />

                {/* Tipo de Contingencia */}
                <div className="group">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Tipo de Contingencia</span>
                  </label>
                  <select
                    value={contingencyType}
                    onChange={(e) => setContingencyType(e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 shadow-sm 
                             focus:border-yellow-500 focus:ring-yellow-500 transition-all duration-200
                             group-hover:border-yellow-200"
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {tiposContingencia.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div className="group">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span>Descripción</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full rounded-xl border-2 border-gray-200 shadow-sm 
                             focus:border-blue-500 focus:ring-blue-500 transition-all duration-200
                             group-hover:border-blue-200"
                    required
                  />
                </div>
              </div>

              {/* Botón de envío mejorado */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl
                             hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200
                             transform hover:scale-105 shadow-md hover:shadow-lg
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center space-x-2`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Reporte</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal con diseño mejorado */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detalles del Reporte</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Organización</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.organization?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Área</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.area}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de Contingencia</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${selectedReport.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-2">Descripción</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 shadow-inner">
                  {selectedReport.description}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
  