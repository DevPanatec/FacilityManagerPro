'use client'

import { useEffect, useState } from 'react'
import { DashboardGrid } from '@/components/DashboardGrid'
import { Widget, LayoutItem } from '@/lib/types/dashboard'

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([])

  useEffect(() => {
    loadWidgets()
  }, [])

  const loadWidgets = async () => {
    const response = await fetch('/api/dashboard/widgets')
    if (!response.ok) {
      console.error('Error al cargar widgets')
      return
    }
    const data = await response.json()
    setWidgets(data)
  }

  const handleLayoutChange = async (layout: LayoutItem[]) => {
    // Actualizar la posición de cada widget
    for (const item of layout) {
      const { i, x, y, w, h } = item
      try {
        await fetch(`/api/dashboard/widgets/${i}`, {
          method: 'PATCH',
          body: JSON.stringify({
            position: { x, y, w, h }
          })
        })
      } catch (error) {
        console.error('Error al actualizar posición:', error)
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <DashboardGrid
        widgets={widgets}
        onLayoutChange={handleLayoutChange}
      />
    </div>
  )
} 