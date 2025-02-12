'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/database';

type Reporte = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
};

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchReportes = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando reportes:', error);
        return;
      }

      setReportes(data || []);
    };

    fetchReportes();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis Reportes</h1>
      <div className="grid gap-4">
        {reportes.map((reporte) => (
          <div key={reporte.id} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">{reporte.title}</h2>
            <p className="text-gray-600">{reporte.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              {new Date(reporte.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
