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

    return NextResponse.json({
      taskStats,
      shiftStats,
      inventoryStats
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 })
  }
} 