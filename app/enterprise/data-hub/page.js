'use client';
import { useState, useEffect, useRef } from 'react';
import { dataHubService } from '@/services/dataHubService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
      setLoading(true);
      const result = await dataHubService.getDataHubSummary();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (format) => {
    try {
      setLoading(true);

      // Verificar datos
      if (!data || !data.organizations) {
        throw new Error('No hay datos disponibles para exportar');
      }

      // Datos básicos para exportar
      const exportData = {
        empresas: data.organizations.map(org => ({
          nombre: org.nombre,
          estado: org.estado,
          personal: org.personal.total,
          areas: org.areas.total,
          servicios: org.actividad.total
        }))
      };

      // Exportar según el formato
      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData.empresas);
        XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
        XLSX.writeFile(wb, 'empresas.xlsx');
      } 
      else if (format === 'csv') {
        const ws = XLSX.utils.json_to_sheet(exportData.empresas);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'empresas.csv');
      }
      else if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, 'empresas.json');
      }

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos: ' + error.message);
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

  const handleFileImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        alert('Por favor seleccione un archivo');
        return;
      }

      setLoading(true);
      const fileExtension = file.name.split('.').pop().toLowerCase();

      let result;
      try {
        switch (fileExtension) {
          case 'xlsx':
          case 'xls':
            result = await dataHubService.importFromExcel(file);
            break;
          case 'csv':
            result = await dataHubService.importFromCSV(file);
            break;
          case 'json':
            result = await dataHubService.importFromJSON(file);
            break;
          default:
            throw new Error(`Formato de archivo no soportado: ${fileExtension}`);
        }

        await loadData();
        alert(result.message);
        setShowImportMenu(false);
      } catch (importError) {
        console.error('Error al importar:', importError);
        alert(`Error al importar: ${importError.message}`);
      }
    } catch (err) {
      console.error('Error general:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async (format) => {
    try {
      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        
        // Datos ficticios de empresas de RRHH y Telecomunicaciones
        const templateData = [
          {
            nombre: "HR Solutions Global",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/hr1.png",
            personal: 180,
            areas: 6,
            servicios: 450
          },
          {
            nombre: "TelecomNet Services",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/telecom1.png",
            personal: 320,
            areas: 8,
            servicios: 780
          },
          {
            nombre: "Talent Hub RH",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/hr2.png",
            personal: 150,
            areas: 5,
            servicios: 380
          },
          {
            nombre: "ConnectTech Solutions",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/telecom2.png",
            personal: 280,
            areas: 7,
            servicios: 650
          },
          {
            nombre: "People First RRHH",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/hr3.png",
            personal: 120,
            areas: 4,
            servicios: 290
          },
          {
            nombre: "DataComm Networks",
            type: "empresa",
            estado: "Activo",
            logo_url: "https://ejemplo.com/telecom3.png",
            personal: 250,
            areas: 6,
            servicios: 580
          }
        ];

        // Crear hoja de datos
        const ws = XLSX.utils.json_to_sheet(templateData);
        
        // Ajustar ancho de columnas
        ws['!cols'] = [
          { wch: 35 }, // nombre
          { wch: 15 }, // type
          { wch: 15 }, // estado
          { wch: 40 }, // logo_url
          { wch: 12 }, // personal
          { wch: 10 }, // areas
          { wch: 12 }  // servicios
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Datos");

        // Descargar archivo
        XLSX.writeFile(wb, 'empresas_rrhh_telecom.xlsx');
        return;
      }

      // Para CSV
      if (format === 'csv') {
        const csvContent = 'nombre,tipo,estado\nEmpresa de Ejemplo,empresa,Activo\nProveedor de Ejemplo,proveedor,Activo';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plantilla_organizaciones.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Para JSON
      if (format === 'json') {
        const jsonContent = JSON.stringify([
          { nombre: "Empresa de Ejemplo", tipo: "empresa", estado: "Activo" },
          { nombre: "Proveedor de Ejemplo", tipo: "proveedor", estado: "Activo" }
        ], null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plantilla_organizaciones.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

    } catch (err) {
      console.error('Error al descargar plantilla:', err);
      alert('Error al descargar la plantilla');
    }
  };

  const getCurrentOrganizations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.organizations.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(data.organizations.length / itemsPerPage);

  const handleDeleteOrganization = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      try {
        setLoading(true);
        await dataHubService.deleteOrganization(id);
        await loadData(); // Recargar los datos
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('Error al eliminar la empresa');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Hub Empresarial</h1>
        <p className="text-gray-600">Gestiona y analiza la información de todas tus empresas en un solo lugar</p>
      </div>

      <div className="flex justify-between mb-8">
        {/* Menú de Exportación */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          >
            <span className="mr-2">↓</span> Exportar
          </button>
          
          {showExportMenu && (
            <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Exportar como JSON
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Exportar como Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Exportar como CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menú de Importación */}
        <div className="relative">
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
                  onClick={handleImport}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Importar datos de APIs externas
                </button>
                
                <div className="px-4 py-2">
                  <p className="text-sm text-gray-500 mb-2">Importar desde archivo:</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleFileImport}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
                
                <div className="border-t border-gray-100"></div>
                
                <div className="px-4 py-2">
                  <p className="text-sm text-gray-500 mb-2">Descargar plantillas:</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadTemplate('excel')}
                      className="block w-full text-left px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      📑 Plantilla Excel
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="block w-full text-left px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      📑 Plantilla CSV
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('json')}
                      className="block w-full text-left px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      🔧 Plantilla JSON
                    </button>
                  </div>
                </div>
                
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500">
                    Formatos soportados: Excel, CSV, JSON
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agregar los contadores en la parte superior */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded">🏢</div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Empresas</p>
              <p className="text-xl font-bold">{data.summary.totalEmpresas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded">👥</div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Personal</p>
              <p className="text-xl font-bold">{data.summary.totalPersonal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded">📊</div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Promedio Actividad</p>
              <p className="text-xl font-bold">{data.summary.promedioActividad}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded">💰</div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Ingresos</p>
              <p className="text-xl font-bold">{data.summary.totalIngresos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex justify-between mb-6">
        <input
          type="text"
          placeholder="Buscar empresa..."
          className="px-4 py-2 border rounded-lg w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>Todas las empresas</option>
            <option>Activas</option>
            <option>Inactivas</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>Ordenar por nombre</option>
            <option>Ordenar por personal</option>
            <option>Ordenar por actividad</option>
          </select>
        </div>
      </div>

      {/* Grid de organizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentOrganizations().map((org) => (
          <div key={org.id} className="bg-white rounded-lg shadow-lg p-6 relative">
            {/* Botón de eliminar */}
            <button
              onClick={() => handleDeleteOrganization(org.id)}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar empresa"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>

            <div className="flex items-center mb-4">
              {org.logo ? (
                <img src={org.logo} alt={org.nombre} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {org.nombre.charAt(0)}
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{org.nombre}</h3>
                <p className="text-sm text-gray-500">{org.estado}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Personal</p>
                <p className="font-semibold">{org.personal.total} {org.personal.label}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Áreas</p>
                <p className="font-semibold">{org.areas.total} {org.areas.label}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Actividad</p>
                <p className="font-semibold">{org.actividad.total} {org.actividad.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agregar botones de paginación */}
      <div className="mt-6 flex justify-center items-center gap-2">
        <nav className="inline-flex rounded-md shadow">
          <button
            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          
          {/* Indicador de páginas */}
          <span className="px-4 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </nav>
      </div>
    </div>
  );
}