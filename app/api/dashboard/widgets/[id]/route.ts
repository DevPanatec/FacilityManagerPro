import { createClient } from '@/app/config/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    // Obtener estadísticas según el tipo de widget
    switch (params.id) {
      case 'task-overview':
        const { data: taskStats, error: taskError } = await supabase
          .from('task_statistics')
          .select('*')
          .single()

        if (taskError) throw taskError
        return NextResponse.json({
          id: params.id,
          type: 'task-stats',
          title: 'Resumen de Tareas',
          data: taskStats
        })

      case 'shift-overview':
        const { data: shiftStats, error: shiftError } = await supabase
          .from('work_shift_statistics')
          .select('*')
          .single()

        if (shiftError) throw shiftError
        return NextResponse.json({
          id: params.id,
          type: 'shift-stats',
          title: 'Resumen de Turnos',
          data: shiftStats
        })

      case 'inventory-overview':
        const { data: inventoryStats, error: inventoryError } = await supabase
          .from('inventory_statistics')
          .select('*')
          .single()

        if (inventoryError) throw inventoryError
        return NextResponse.json({
          id: params.id,
          type: 'inventory-stats',
          title: 'Resumen de Inventario',
          data: inventoryStats
        })

      default:
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error fetching widget data' }, { status: 500 })
  }
} 