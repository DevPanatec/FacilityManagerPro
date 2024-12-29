'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    table_name: '',
    action: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    const queryParams = new URLSearchParams({
      ...filters,
      page: '1',
      limit: '50'
    });

    const response = await fetch(`/api/audit-logs?${queryParams}`);
    const data = await response.json();
    setLogs(data.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Registros de Auditoría</h1>
      
      {/* Filtros */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <select
          value={filters.table_name}
          onChange={(e) => setFilters({...filters, table_name: e.target.value})}
          className="border rounded p-2"
        >
          <option value="">Todas las tablas</option>
          <option value="users">Usuarios</option>
          <option value="facilities">Instalaciones</option>
          <option value="assignments">Asignaciones</option>
          <option value="maintenance_records">Mantenimiento</option>
          <option value="inventory_items">Inventario</option>
        </select>

        <select
          value={filters.action}
          onChange={(e) => setFilters({...filters, action: e.target.value})}
          className="border rounded p-2"
        >
          <option value="">Todas las acciones</option>
          <option value="INSERT">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
        </select>

        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters({...filters, from_date: e.target.value})}
          className="border rounded p-2"
        />

        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters({...filters, to_date: e.target.value})}
          className="border rounded p-2"
        />
      </div>

      {/* Tabla de logs */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Tabla</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">
                  {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss')}
                </td>
                <td className="px-4 py-2">{log.table_name}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded ${
                    log.action === 'INSERT' ? 'bg-green-100 text-green-800' :
                    log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2">{log.changed_by?.email}</td>
                <td className="px-4 py-2">
                  <button 
                    onClick={() => console.log(log)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver cambios
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 