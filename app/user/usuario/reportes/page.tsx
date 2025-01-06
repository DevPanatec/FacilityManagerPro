'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Report {
  id: number;
  titulo: string;
  fecha: string;
  estado: 'Pendiente' | 'Resuelto';
  descripcion: string;
  archivos?: string[];
  esContingencia: boolean;
}

export default function ReportesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reports, setReports] = useState<Report[]>([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Transform the data to match the Report type
      const transformedReports: Report[] = data.map(report => ({
        id: report.id,
        titulo: report.titulo,
        fecha: new Date(report.fecha).toISOString().split('T')[0],
        estado: report.estado === 'Pendiente' ? 'Pendiente' : 'Resuelto',
        descripcion: report.descripcion,
        archivos: report.archivos || [],
        esContingencia: report.es_contingencia || false
      }));

      setReports(transformedReports);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching reports';
      console.error('Error fetching reports:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Reportes
        </h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/user/usuario/reportes/${report.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.titulo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.estado === 'Resuelto' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.esContingencia ? 'Contingencia' : 'Normal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay reportes disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
