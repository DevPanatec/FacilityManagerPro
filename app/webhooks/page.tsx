'use client';

import { useEffect, useState } from 'react';

export default function WebhooksAdminPanel() {
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);

  // Cargar webhooks
  useEffect(() => {
    fetch('/api/webhook-admin')
      .then(res => res.json())
      .then(data => setWebhooks(data.data));
  }, []);

  // Cargar logs
  useEffect(() => {
    fetch('/api/webhook-logs')
      .then(res => res.json())
      .then(data => setLogs(data.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración de Webhooks</h1>
      
      {/* Sección de Configuraciones */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuraciones de Webhook</h2>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Evento</th>
              <th className="px-4 py-2">Endpoint</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((webhook: any) => (
              <tr key={webhook.id} className="border-t">
                <td className="px-4 py-2">{webhook.event_type}</td>
                <td className="px-4 py-2">{webhook.endpoint_url}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded ${webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {webhook.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button className="mr-2 text-blue-600 hover:text-blue-800">Editar</button>
                  <button className="text-red-600 hover:text-red-800">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sección de Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Historial de Eventos</h2>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Evento</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{log.event_type}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded ${
                    log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 
                    log.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:text-blue-800">Ver detalles</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 