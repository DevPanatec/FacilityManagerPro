import { supabaseService } from './supabaseService'
import { taskService } from './taskService'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TestResult {
  success: boolean;
  error?: string;
  details?: any;
  logs: string[];
  errors: string[];
}

type User = Database['public']['Tables']['users']['Row']

export const testService = {
  testTaskFlow: async (): Promise<TestResult> => {
    const results: TestResult = {
      success: true,
      logs: [],
      errors: []
    }

    try {
      // 1. Obtener el usuario actual
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('No autorizado')

      // Obtener el organization_id del usuario
      const supabase = createClientComponentClient<Database>()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id, first_name, last_name')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError
      if (!userData?.organization_id) throw new Error('Usuario sin organización asignada')

      // 2. Crear una tarea de prueba
      const testTask = {
        title: `Tarea de prueba creada por ${userData.first_name} ${userData.last_name}`,
        description: 'Esta es una tarea de prueba para verificar el sistema',
        priority: 'medium',
        organization_id: userData.organization_id,
        status: 'pending'
      }

      const { data: createdTask, error: createError } = await taskService.createTask(testTask)
      if (createError || !createdTask) {
        results.success = false
        results.errors.push(`Error al crear tarea: ${createError ? String(createError) : 'Error desconocido'}`)
        return results
      }

      results.logs.push(`✓ Creación de tarea exitosa por ${userData.first_name} ${userData.last_name}`)

      // 3. Asignar la tarea a un usuario enterprise
      const { data: enterpriseUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'enterprise')
        .limit(1)
        .single()

      if (usersError || !enterpriseUsers) {
        results.success = false
        results.errors.push('No se encontró usuario enterprise')
        return results
      }

      const { error: assignError } = await taskService.assignTask(createdTask.id, enterpriseUsers.id)
      if (assignError) {
        results.success = false
        results.errors.push(`Error al asignar tarea: ${String(assignError)}`)
        return results
      }

      results.logs.push(`✓ Asignación de tarea exitosa por ${userData.first_name} ${userData.last_name}`)

      // 4. Cerrar sesión del usuario
      await supabaseService.auth.logout()
      results.logs.push(`✓ Logout de ${userData.first_name} ${userData.last_name} exitoso`)

      return results
    } catch (error) {
      console.error('Error en test de flujo de tareas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en test de flujo de tareas',
        logs: results.logs,
        errors: results.errors
      }
    }
  }
} 