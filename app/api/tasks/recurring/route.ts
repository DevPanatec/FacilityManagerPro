import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RecurrencePattern, Task } from '../../../../lib/types/tasks'
import { addDays, addWeeks, addMonths, addYears, isWeekend } from 'date-fns'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const baseTask: Task = body.task
    const recurrence: RecurrencePattern = body.recurrence

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
    const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null
    const maxInstances = recurrence.maxOccurrences || 52 // límite por defecto

    while (instances.length < maxInstances) {
      // Calcular siguiente fecha según frecuencia
      switch (recurrence.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, recurrence.interval)
          break
        case 'weekly':
          currentDate = addWeeks(currentDate, recurrence.interval)
          break
        case 'monthly':
          currentDate = addMonths(currentDate, recurrence.interval)
          break
        case 'yearly':
          currentDate = addYears(currentDate, recurrence.interval)
          break
        default:
          throw new Error('Frecuencia no soportada')
      }

      // Verificar fecha límite
      if (endDate && currentDate > endDate) {
        break
      }

      // Saltar fines de semana si está configurado
      if (recurrence.skipWeekends && isWeekend(currentDate)) {
        continue
      }

      // Saltar días festivos si está configurado
      if (recurrence.skipHolidays && checkHoliday(currentDate)) {
        continue
      }

      // Verificar días específicos
      if (recurrence.weekdays &&
          !recurrence.weekdays.includes(currentDate.getDay())) {
        continue
      }

      // Crear nueva instancia de tarea
      const newTask: Partial<Task> = {
        ...baseTask,
        due_date: currentDate.toISOString(),
        recurrence: undefined, // las instancias no son recurrentes
        parent_task_id: baseTask.id,
        status: 'pending'
      }

      instances.push(newTask)
    }

    // Insertar todas las instancias
    const { data, error } = await supabase
      .from('tasks')
      .insert(instances)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al generar tareas recurrentes';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    
    console.error('Error generando tareas recurrentes:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Función auxiliar para verificar días festivos
function checkHoliday(date: Date): boolean {
  // Implementar lógica de verificación de días festivos
  return false
} 
