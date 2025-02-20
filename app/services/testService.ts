import { supabaseService } from './supabaseService'
import { taskService } from './taskService'

interface TestResult {
  success: boolean;
  error?: string;
  details?: any;
}

export const testService = {
  testTaskFlow: async (): Promise<TestResult> => {
    try {
      // 1. Obtener el usuario actual
      const { data: { user }, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No autorizado')

      // 2. Crear una tarea de prueba
      const testTask = {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        priority: 'medium',
        organization_id: user.id // Asumiendo que el usuario tiene una organización
      }

      const createdTask = await taskService.createTask(testTask)

      // 3. Actualizar la tarea
      const updatedTask = await taskService.updateTask(createdTask.id, {
        status: 'in_progress'
      })

      // 4. Eliminar la tarea de prueba
      await taskService.deleteTask(createdTask.id)

      return {
        success: true,
        details: {
          created: createdTask,
          updated: updatedTask
        }
      }
    } catch (error) {
      console.error('Error en test de flujo de tareas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en test de flujo de tareas'
      }
    }
  }
} 