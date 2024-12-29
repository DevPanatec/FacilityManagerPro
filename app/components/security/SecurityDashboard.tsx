'use client';

import { useEffect, useState } from 'react';
import { Card, Title, BarChart, DonutChart } from '@tremor/react';

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/security-metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando métricas de seguridad...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <Title>Intentos de Login</Title>
        {/* Aquí irán los gráficos de métricas */}
      </Card>
    </div>
  );
} 