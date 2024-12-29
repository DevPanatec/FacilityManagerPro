'use client'

import { useState, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Widget, LayoutItem, DashboardLayout } from '@/lib/types/dashboard'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  widgets: Widget[]
  onLayoutChange?: (layout: LayoutItem[]) => void
}

export function DashboardGrid({ 
  widgets,
  onLayoutChange 
}: DashboardGridProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>([])
  const [layouts, setLayouts] = useState<DashboardLayout[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar layouts guardados
  useEffect(() => {
    loadLayouts()
  }, [])

  const loadLayouts = async () => {
    try {
      const response = await fetch('/api/dashboard/layouts')
      if (!response.ok) throw new Error('Error al cargar layouts')
      const data = await response.json()
      setLayouts(data)
      
      // Usar el layout por defecto si existe
      const defaultLayout = data.find((l: DashboardLayout) => l.is_default)
      if (defaultLayout) {
        setCurrentLayout(defaultLayout.layout)
      } else {
        // Usar posiciones guardadas de los widgets
        setCurrentLayout(
          widgets.map(widget => ({
            i: widget.id,
            ...widget.position
          }))
        )
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLayoutChange = (layout: LayoutItem[]) => {
    setCurrentLayout(layout)
    onLayoutChange?.(layout)
  }

  const handleSaveLayout = async (name: string, isDefault: boolean = false) => {
    try {
      const response = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          layout: currentLayout,
          is_default: isDefault
        })
      })
      if (!response.ok) throw new Error('Error al guardar layout')
      const newLayout = await response.json()
      setLayouts([...layouts, newLayout])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="p-4">
      {/* Controles de layout */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleSaveLayout('Mi Layout', true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Guardar Layout
        </button>
      </div>

      {/* Grid de widgets */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
      >
        {widgets.map(widget => (
          <div key={widget.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">{widget.title}</h3>
            {/* Renderizar el contenido del widget según su tipo */}
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}

// Función auxiliar para renderizar widgets según su tipo
function renderWidget(widget: Widget) {
  switch (widget.widget_type) {
    case 'chart':
      return <div>Gráfico aquí</div>
    case 'stats':
      return <div>Estadísticas aquí</div>
    case 'table':
      return <div>Tabla aquí</div>
    default:
      return <div>Widget no soportado</div>
  }
} 