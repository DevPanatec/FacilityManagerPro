'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/config'
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription'

type Props<T> = {
  table: string
  columns: (keyof T)[]
  title: string
}

export default function RealtimeTable<T extends { id: number | string }>({ 
  table, 
  columns,
  title 
}: Props<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: initialData, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setData(initialData || [])
      } catch (error) {
        console.error(`Error cargando ${table}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table])

  // Suscribirse a cambios en tiempo real
  useRealtimeSubscription({
    table: table as any,
    onInsert: (payload) => {
      setData(prev => [payload.new as T, ...prev])
    },
    onUpdate: (payload) => {
      setData(prev => 
        prev.map(item => 
          item.id === payload.new.id ? payload.new as T : item
        )
      )
    },
    onDelete: (payload) => {
      setData(prev => 
        prev.filter(item => item.id !== payload.old.id)
      )
    }
  })

  if (loading) {
    return <div>Cargando {title}...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="space-y-2">
        {data.map((item) => (
          <div 
            key={item.id}
            className="p-4 border rounded-lg shadow"
          >
            {columns.map((column) => (
              <p key={column as string}>
                {column as string}: {String(item[column])}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
} 