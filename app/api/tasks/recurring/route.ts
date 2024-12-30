import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RecurrencePattern, Task } from '@/lib/types/tasks'
import { addDays, addWeeks, addMonths, addYears, isWeekend, isHoliday } from 'date-fns'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { task, recurrence } = body

    // Validar datos requeridos
    if (!task.title || !recurrence.frequency) {
      throw new Error('Datos incompletos')
    }

    // Crear tarea base
    const { data: baseTask, error: baseError } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: user.id,
        recurrence
      })
      .select()
      .single()

    if (baseError) throw baseError

    // Generar instancias recurrentes
    const instances = generateRecurringInstances(baseTask, recurrence)
    
    // Insertar instancias
    if (instances.length > 0) {
      const { error: instancesError } = await supabase
        .from('tasks')
        .insert(instances)

      if (instancesError) throw instancesError
    }

    return NextResponse.json(baseTask)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

function generateRecurringInstances(
  baseTask: Task,
  recurrence: RecurrencePattern
): Partial<Task>[] {
  const instances: Partial<Task>[] = []
  let currentDate = new Date(baseTask.due_date)
  const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null
  const maxInstances = recurrence.maxOccurrences || 52 // límite por defecto

  while (instances.length < maxInstances) {
    // Calcular siguiente fecha según frecuencia
    switch (recurrence.frequency) {
      case 'daily':
        currentDate = addDays(currentDate, recurrence.interval || 1)
        break
      case 'weekly':
        currentDate = addWeeks(currentDate, recurrence.interval || 1)
        break
      case 'monthly':
        currentDate = addMonths(currentDate, recurrence.interval || 1)
        break
      case 'yearly':
        currentDate = addYears(currentDate, recurrence.interval || 1)
        break
    }

    // Verificar si hemos llegado al final
    if (endDate && currentDate > endDate) break

    // Saltar días no deseados
    if (recurrence.skipWeekends && isWeekend(currentDate)) {
      continue
    }

    if (recurrence.skipHolidays && isHoliday(currentDate)) {
      continue
    }

    // Verificar días específicos
    if (recurrence.daysOfWeek && 
        !recurrence.daysOfWeek.includes(currentDate.getDay())) {
      continue
    }

    if (recurrence.daysOfMonth && 
        !recurrence.daysOfMonth.includes(currentDate.getDate())) {
      continue
    }

    if (recurrence.monthsOfYear && 
        !recurrence.monthsOfYear.includes(currentDate.getMonth() + 1)) {
      continue
    }

    // Crear instancia
    instances.push({
      ...baseTask,
      id: undefined, // Supabase generará nuevo ID
      due_date: currentDate.toISOString(),
      parent_task_id: baseTask.id,
      recurrence: undefined // Las instancias no tienen recurrencia
    })
  }

  return instances
}

// Función auxiliar para verificar días festivos
function isHoliday(date: Date): boolean {
  // Implementar lógica de días festivos
  // Puedes usar una librería o mantener una lista en la base de datos
  return false
} 