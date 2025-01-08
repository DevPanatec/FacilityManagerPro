import { createClient } from '@/app/config/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  try {
    // Obtener estadísticas de tareas
    const { data: taskStats, error: taskError } = await supabase
      .from('task_statistics')
      .select('*')
      .single()

    if (taskError) throw taskError

    // Obtener estadísticas de turnos
    const { data: shiftStats, error: shiftError } = await supabase
      .from('work_shift_statistics')
      .select('*')
      .single()

    if (shiftError) throw shiftError

    // Obtener estadísticas de inventario
    const { data: inventoryStats, error: inventoryError } = await supabase
      .from('inventory_statistics')
      .select('*')
      .single()

    if (inventoryError) throw inventoryError

    // Estructurar el layout por defecto
    const defaultLayout = {
      id: 'default',
      name: 'Default Layout',
      widgets: [
        {
          id: 'task-overview',
          type: 'task-stats',
          title: 'Resumen de Tareas',
          data: taskStats,
          position: { x: 0, y: 0, w: 6, h: 4 }
        },
        {
          id: 'shift-overview',
          type: 'shift-stats',
          title: 'Resumen de Turnos',
          data: shiftStats,
          position: { x: 6, y: 0, w: 6, h: 4 }
        },
        {
          id: 'inventory-overview',
          type: 'inventory-stats',
          title: 'Resumen de Inventario',
          data: inventoryStats,
          position: { x: 0, y: 4, w: 12, h: 4 }
        }
      ]
    }

    return NextResponse.json([defaultLayout])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error fetching layout data' }, { status: 500 })
  }
} 