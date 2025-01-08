import { createClient } from '@/app/config/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  try {
    // Obtener estadísticas de tareas
    const { data: taskStats, error: taskError } = await supabase
      .from('task_statistics')
      .select('*')

    if (taskError) throw taskError

    // Obtener estadísticas de turnos
    const { data: shiftStats, error: shiftError } = await supabase
      .from('work_shift_statistics')
      .select('*')

    if (shiftError) throw shiftError

    // Obtener estadísticas de inventario
    const { data: inventoryStats, error: inventoryError } = await supabase
      .from('inventory_statistics')
      .select('*')

    if (inventoryError) throw inventoryError

    // Estructurar los widgets
    const widgets = [
      {
        id: 'task-overview',
        type: 'task-stats',
        title: 'Resumen de Tareas',
        data: taskStats
      },
      {
        id: 'shift-overview',
        type: 'shift-stats',
        title: 'Resumen de Turnos',
        data: shiftStats
      },
      {
        id: 'inventory-overview',
        type: 'inventory-stats',
        title: 'Resumen de Inventario',
        data: inventoryStats
      }
    ]

    return NextResponse.json(widgets)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error fetching widgets data' }, { status: 500 })
  }
} 