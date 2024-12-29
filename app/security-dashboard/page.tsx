'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState({
    failedLogins: [],
    rateLimitHits: [],
    securityEvents: [],
    activeUsers: 0,
    blockedAccounts: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // Intentos fallidos de login
    const { data: failedLogins } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Eventos de seguridad
    const { data: securityEvents } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Cuentas bloqueadas
    const { count: blockedCount } = await supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact' })
      .eq('is_locked', true);

    setMetrics({
      ...metrics,
      failedLogins: failedLogins || [],
      securityEvents: securityEvents || [],
      blockedAccounts: blockedCount || 0
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Seguridad</h1>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium">Intentos Fallidos (24h)</h3>
          <p className="text-3xl font-bold text-red-600">
            {metrics.failedLogins.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium">Cuentas Bloqueadas</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {metrics.blockedAccounts}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium">Eventos de Seguridad</h3>
          <p className="text-3xl font-bold text-blue-600">
            {metrics.securityEvents.length}
          </p>
        </div>
      </div>

      {/* Tabla de eventos recientes */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Eventos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {metrics.securityEvents.map((event: any) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-2">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      event.event_type.includes('ERROR') ? 'bg-red-100 text-red-800' :
                      event.event_type.includes('WARNING') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{event.ip_address}</td>
                  <td className="px-4 py-2">
                    <pre className="text-sm">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 