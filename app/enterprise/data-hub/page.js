'use client';
import { useState, useEffect, useRef } from 'react';
import { dataHubService } from '@/services/dataHubService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { importExportService } from '@/services/importExportService';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function DataHubPage() {
  const [data, setData] = useState({
    summary: {
      totalEmpresas: 0,
      totalPersonal: 0,
      promedioActividad: 0,
      totalIngresos: "$0"
    },
    organizations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todas las empresas');
  const [sortBy, setSortBy] = useState('Ordenar por nombre');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      console.log('A. Iniciando loadData...');
      setLoading(true);
      setError(null);
      const result = await dataHubService.getDataHubSummary();
      console.log('B. Datos obtenidos en loadData:', result);
      setData(result);
      console.log('C. Estado actualizado con:', result);
    } catch (err) {
      console.error('D. Error cargando datos:', err);
      setError(err.message);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (format) => {
    try {
      setLoading(true);
      await importExportService.exportData(format);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const result = await dataHubService.importExternalData();
      await loadData(); // Recargar datos después de importar
      setShowImportMenu(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (file, format) => {
    try {
      setLoading(true);
      let result;
      
      switch (format) {
        case 'excel':
          result = await importExportService.importFromExcel(file);
          break;
        case 'csv':
          result = await importExportService.importFromCSV(file);
          break;
        case 'json':
          result = await importExportService.importFromJSON(file);
          break;
        default:
          throw new Error('Formato no soportado');
      }

      await loadData(); // Recargar datos después de importar
      alert(result.message || 'Importación exitosa');
    } catch (error) {
      console.error('Error importando archivo:', error);
      alert('Error al importar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const wb = XLSX.utils.book_new();
    
    // Plantilla con el formato correcto
    const templateData = [
      {
        nombre: "Hombres de Blanco",
        type: "empresa",
        logo_url: "/logos/hdb-logo.png",
        personal: 156,
        areas: 12,
        servicios: 1234
      },
      {
        nombre: "Servicio de Seguridad",
        type: "empresa",
        logo_url: null,
        personal: 234,
        areas: 8,
        servicios: 892
      },
      {
        nombre: "Servicio de Transporte",
        type: "empresa",
        logo_url: null,
        personal: 178,
        areas: 6,
        servicios: 678
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 30 }, // nombre
      { wch: 15 }, // type
      { wch: 40 }, // logo_url
      { wch: 15 }, // personal
      { wch: 15 }, // areas
      { wch: 15 }  // servicios
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, 'template_organizaciones.xlsx');
  };

  const getCurrentOrganizations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.organizations.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(data.organizations.length / itemsPerPage);

  const handleDeleteOrganization = async (id) => {
    if (!id) {
      console.error('ID no válido:', id);
      toast.error('Error: ID de organización no válido');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      try {
        setLoading(true);
        console.log('Intentando eliminar organización con ID:', id);

        // Usar el servicio en lugar de llamar directamente a Supabase
        const result = await dataHubService.deleteOrganization(id);
        console.log('Resultado de eliminación:', result);

        if (result.success) {
          await loadData();
          toast.success('Empresa eliminada correctamente');
        } else {
          throw new Error('No se pudo eliminar la empresa');
        }
      } catch (error) {
        console.error('Error detallado:', {
          message: error.message,
          error: error,
          stack: error.stack
        });
        toast.error(`Error al eliminar: ${error.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExcelImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        toast.error('Por favor seleccione un archivo Excel');
        return;
      }

      setLoading(true);
      console.log('1. Iniciando importación del archivo:', file.name);

      const result = await importExportService.importFromExcel(file);
      console.log('2. Resultado de la importación:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Recargar los datos inmediatamente después de la importación
      console.log('3. Recargando datos...');
      await loadData();
      console.log('4. Datos recargados');
      
      toast.success(`Importación exitosa: ${result.data?.message || 'Datos importados correctamente'}`);
    } catch (error) {
      console.error('Error en importación:', error);
      toast.error(`Error al importar: ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegación */}
      <nav className="bg-[#2563EB] text-white">
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          {/* Logo de Marpesca */}
          <div className="flex items-center">
            <img 
              src="/marpesca-white.png" 
              alt="Marpesca" 
              className="h-6"
            />
          </div>

          {/* Enlaces de navegación - centrados */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-white hover:text-gray-100">Panel Principal</a>
            <a href="#" className="text-white hover:text-gray-100">Calendario</a>
            <a href="#" className="text-white hover:text-gray-100">Recursos Humanos</a>
            <a href="#" className="text-white hover:text-gray-100">Inventario</a>
            <a href="#" className="text-white hover:text-gray-100">Centro de Datos</a>
          </div>

          {/* Botón de cerrar sesión */}
          <div className="flex items-center">
            <button className="flex items-center text-white hover:text-gray-100">
              <span>Cerrar Sesión</span>
              <svg 
                className="w-5 h-5 ml-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Hub Empresarial</h1>
          <p className="text-gray-600">Gestiona y analiza la información de todas tus empresas en un solo lugar</p>
        </div>

        {/* Botones de Exportar/Importar */}
        <div className="flex justify-between mb-8">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="bg-[#2563EB] text-white px-6 py-2 rounded-md flex items-center"
          >
            ↓ Exportar
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => setShowImportMenu(!showImportMenu)}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
            >
              <span className="mr-2">↑</span> Importar
            </button>
            
            {showImportMenu && (
              <div className="absolute right-0 z-10 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Importar desde Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Empresas */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="border-l-[3px] border-blue-500 pl-4">
              <div className="flex items-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 2H5C3.346 2 2 3.346 2 5v14c0 1.654 1.346 3 3 3h14c1.654 0 3-1.346 3-3V5c0-1.654-1.346-3-3-3zm0 16H5V5h14v13z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Empresas</p>
                  <p className="text-xl font-bold text-gray-700">{data.summary.totalEmpresas}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Personal */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="border-l-[3px] border-green-500 pl-4">
              <div className="flex items-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Personal</p>
                  <p className="text-xl font-bold text-gray-700">{data.summary.totalPersonal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Promedio Actividad */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="border-l-[3px] border-purple-500 pl-4">
              <div className="flex items-center">
                <div className="bg-purple-50 rounded-lg p-2">
                  <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Promedio Actividad</p>
                  <p className="text-xl font-bold text-gray-700">{data.summary.promedioActividad}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Ingresos */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="border-l-[3px] border-yellow-500 pl-4">
              <div className="flex items-center">
                <div className="bg-yellow-50 rounded-lg p-2">
                  <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Ingresos</p>
                  <p className="text-xl font-bold text-yellow-500">{data.summary.totalIngresos}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center w-2/3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option>Todas las empresas</option>
                <option>Activas</option>
                <option>Inactivas</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option>Ordenar por nombre</option>
                <option>Ordenar por personal</option>
                <option>Ordenar por actividad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tarjetas de empresas */}
        <div className="grid grid-cols-3 gap-6">
          {data.organizations.map((org) => (
            <div key={org.id} className="bg-white rounded-xl shadow-sm p-6">
              {/* Encabezado de la tarjeta */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={org.name || 'Logo'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-lg font-bold">
                        {(org.name || 'E').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">{org.name || 'Sin nombre'}</h3>
                    <p className="text-sm text-gray-500">{org.type || 'Sin tipo'}</p>
                  </div>
                </div>
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleDeleteOrganization(org.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                  title="Eliminar empresa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Estadísticas */}
              <div className="space-y-3">
                {/* Personal */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Personal</p>
                      <p className="text-blue-600 font-semibold">
                        {org.personal?.total || 0} empleados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Áreas */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-green-600">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Áreas</p>
                      <p className="text-green-600 font-semibold">
                        {org.areas?.total || 0} áreas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-purple-600">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Servicios</p>
                      <p className="text-purple-600 font-semibold">
                        {org.actividad?.total || 0} {org.actividad?.label || 'servicios'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}