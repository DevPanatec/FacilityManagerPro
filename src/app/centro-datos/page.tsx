'use client';

import { useState, useEffect } from 'react';
import { dataHubService } from '@/services/dataHubService';

export default function DataHub() {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Todas las empresas');
  const [sortBy, setSortBy] = useState('nombre');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const result = await dataHubService.getDataHubSummary();
    setData(result);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!id) {
      alert('ID de organización no válido');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar ${nombre}?`)) {
      try {
        await dataHubService.deleteOrganization(id);
        await loadData(); // Recargar datos
        alert('Organización eliminada con éxito');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la organización');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las organizaciones? Esta acción no se puede deshacer.')) {
      try {
        await dataHubService.deleteAllOrganizations();
        await loadData(); // Recargar los datos
        alert('Todas las organizaciones han sido eliminadas');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar las organizaciones');
      }
    }
  };

  return (
    <main className="p-8 max-w-[1400px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Data Hub Empresarial</h1>
        <p className="text-gray-600">Gestiona y analiza la información de todas tus empresas en un solo lugar</p>
      </div>

      <div className="flex justify-between mb-8">
        <button 
          onClick={() => dataHubService.exportEnterpriseData()}
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <span>⬇️</span> Exportar
        </button>
        <button 
          onClick={handleDeleteAll}
          className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <span>🗑️</span> Eliminar Todo
        </button>
        <button 
          className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <span>⬆️</span> Importar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Empresas */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Empresas</div>
            <div className="text-xl font-semibold text-gray-800">{data?.summary.totalEmpresas || 3}</div>
          </div>
        </div>

        {/* Total Personal */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
          <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Personal</div>
            <div className="text-xl font-semibold text-green-600">568</div>
          </div>
        </div>

        {/* Promedio Actividad */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
          <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <div className="text-sm text-gray-600">Promedio Actividad</div>
            <div className="text-xl font-semibold text-purple-600">2,804</div>
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
          <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Ingresos</div>
            <div className="text-xl font-semibold text-yellow-600">$573.3K</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar empresa..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 min-w-[200px]"
        >
          <option>Todas las empresas</option>
          <option>Activas</option>
          <option>Inactivas</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 min-w-[200px]"
        >
          <option value="nombre">Ordenar por nombre</option>
          <option value="personal">Ordenar por personal</option>
          <option value="actividad">Ordenar por actividad</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {data?.organizations?.map((org: any) => (
          <div key={org.id} className="bg-white rounded-xl p-6 shadow-sm relative group">
            {/* Botón de eliminar */}
            <button
              onClick={() => handleDelete(org.id, org.nombre)}
              className="absolute top-3 right-3 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              title="Eliminar organización"
            >
              🗑️
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl font-semibold">
                {org.logo ? (
                  <img src={org.logo} alt={org.nombre} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  'S'
                )}
              </div>
              <div>
                <h3 className="text-gray-800 font-medium">{org.nombre}</h3>
                <span className="text-sm text-gray-400">ID: {org.id}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-blue-50/40 rounded-lg p-4 flex items-center gap-3">
                <span className="text-blue-600">👥</span>
                <div>
                  <div className="text-blue-600">{org.personal.total} empleados</div>
                  <div className="text-sm text-gray-500">Personal</div>
                </div>
              </div>

              <div className="bg-green-50/40 rounded-lg p-4 flex items-center gap-3">
                <span className="text-green-600">📈</span>
                <div>
                  <div className="text-green-600">{org.areas.total} áreas</div>
                  <div className="text-sm text-gray-500">Áreas</div>
                </div>
              </div>

              <div className="bg-purple-50/40 rounded-lg p-4 flex items-center gap-3">
                <span className="text-purple-600">📊</span>
                <div>
                  <div className="text-purple-600">{org.actividad.total} operativos</div>
                  <div className="text-sm text-gray-500">Actividad</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 