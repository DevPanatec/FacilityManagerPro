'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    event_type: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/security-logs?${queryParams}`);
    const data = await response.json();
    setLogs(data.data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Logs de Seguridad</h1>
      
      {/* Filtros */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <select
          value={filters.event_type}
          onChange={(e) => setFilters({...filters, event_type: e.target.value})}
          className="border rounded p-2"
        >
          <option value="">Todos los eventos</option>
          <option value="UNAUTHORIZED_ACCESS">Acceso no autorizado</option>
          <option value="INVALID_PAYLOAD">Payload inválido</option>
          <option value="INVALID_EVENT_TYPE">Tipo de evento inválido</option>
          <option value="INTERNAL_ERROR">Error interno</option>
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
              <th className="px-4 py-2">Tipo de Evento</th>
              <th className="px-4 py-2">IP</th>
              <th className="px-4 py-2">User Agent</th>
              <th className="px-4 py-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded ${
                    log.event_type === 'UNAUTHORIZED_ACCESS' ? 'bg-red-100 text-red-800' :
                    log.event_type === 'INVALID_PAYLOAD' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.event_type}
                  </span>
                </td>
                <td className="px-4 py-2">{log.ip_address}</td>
                <td className="px-4 py-2 truncate max-w-xs">{log.user_agent}</td>
                <td className="px-4 py-2">
                  <button 
                    onClick={() => console.log(log.details)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver detalles
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