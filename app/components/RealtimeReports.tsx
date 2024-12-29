'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/config'

type Report = {
  id: number
  created_at: string
  title: string
  description?: string
  status: string
  user_id: string
}

export default function RealtimeReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Cargar datos iniciales
  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setReports(data || [])
      } catch (error) {
        console.error('Error cargando reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  // 2. Suscribirse a cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('mi_canal_personalizado')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          // Añadir nuevo reporte al estado
          setReports(prevReports => [payload.new as Report, ...prevReports])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          // Actualizar reporte existente
          setReports(prevReports => 
            prevReports.map(report => 
              report.id === payload.new.id ? payload.new as Report : report
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          // Eliminar reporte del estado
          setReports(prevReports => 
            prevReports.filter(report => report.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    // Limpieza al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 3. Renderizar UI
  if (loading) {
    return <div>Cargando reports...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reports en tiempo real</h2>
      <div className="space-y-2">
        {reports.map((report) => (
          <div 
            key={report.id}
            className="p-4 border rounded-lg shadow"
          >
            <p>ID: {report.id}</p>
            <p>Creado: {new Date(report.created_at).toLocaleString()}</p>
            {/* Añade aquí los demás campos que quieras mostrar */}
          </div>
        ))}
      </div>
    </div>
  )
} 