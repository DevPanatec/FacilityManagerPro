'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Report {
  id: number;
  title: string;
  date: string;
  status: string;
}

export default function ReportesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reports, setReports] = useState<Report[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Reportes
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Funcionalidad no implementada
          </p>
        </div>
      </div>
    </div>
  );
}
