'use client';
import { useState } from 'react';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Data Hub</h1>
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumen</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Total Empresas</p>
            <p className="text-2xl font-bold">{data.summary.totalEmpresas}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Total Personal</p>
            <p className="text-2xl font-bold">{data.summary.totalPersonal}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Promedio Actividad</p>
            <p className="text-2xl font-bold">{data.summary.promedioActividad}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600">Total Ingresos</p>
            <p className="text-2xl font-bold">{data.summary.totalIngresos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}