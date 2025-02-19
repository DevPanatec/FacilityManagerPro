import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  end_date?: string
  maxOccurrences?: number
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { baseTask, recurrence } = body as {
      baseTask: Partial<Task>
      recurrence: RecurrencePattern
    }

    if (!baseTask.due_date) {
      throw new Error('La tarea debe tener una fecha de vencimiento')
    }

    // Validar recurrencia
    if (!recurrence || !recurrence.frequency || !recurrence.interval) {
      throw new Error('Patrón de recurrencia inválido')
    }

    // Generar instancias de tareas recurrentes
    const instances: Partial<Task>[] = []
    let currentDate = new Date(baseTask.due_date)
    const endDate = recurrence.end_date ? new Date(recurrence.end_date) : null
    const maxInstances = recurrence.maxOccurrences || 52 // límite por defecto

    while (instances.length < maxInstances) {
      if (endDate && currentDate > endDate) break

      instances.push({
        ...baseTask,
        due_date: currentDate.toISOString(),
        status: 'pending'
      })

      // Calcular siguiente fecha según la frecuencia
      switch (recurrence.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrence.interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurrence.interval))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval)
          break
      }
    }

    // Insertar todas las instancias
    const { data, error } = await supabase
      .from('tasks')
      .insert(instances)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear tareas recurrentes'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// Función auxiliar para verificar días festivos
function checkHoliday(date: Date): boolean {
  // Implementar lógica de verificación de días festivos
  return false
} 