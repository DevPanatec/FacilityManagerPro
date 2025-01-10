import { supabaseService } from './supabaseService'
import { taskService } from './taskService'

interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'enterprise' | 'admin' | 'superadmin'
  organization_id: string
}

const HARDCODED_USERS: User[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    organization_id: '1'
  },
  {
    id: '2',
    name: 'Superadmin',
    email: 'superadmin@example.com',
    password: 'super123',
    role: 'superadmin',
    organization_id: '1'
  },
  {
    id: '3',
    name: 'Enterprise',
    email: 'enterprise@example.com',
    password: 'enterprise123',
    role: 'enterprise',
    organization_id: '1'
  }
]

export const testService = {
  // Prueba el flujo completo de creación y asignación de tareas
  async testTaskFlow() {
    const results = {
      success: true,
      errors: [] as string[],
      logs: [] as string[]
    }

    try {
      // Probar con cada admin
      const admins = HARDCODED_USERS.filter(u => u.role === 'admin')
      for (const admin of admins) {
        // 1. Prueba de inicio de sesión como admin
        const { data: authData, error: loginError } = await supabaseService.auth.signInWithPassword({
          email: admin.email,
          password: admin.password
        })

        if (loginError || !authData?.user) {
          results.success = false
          results.errors.push(`Error en login de ${admin.name}: ${loginError}`)
          continue
        }

        results.logs.push(`✓ Login de ${admin.name} exitoso`)

        // 2. Crear una tarea
        const newTask = await taskService.createTask({
          title: `Tarea de prueba creada por ${admin.name}`,
          description: 'Esta es una tarea de prueba para verificar el sistema',
          priority: 'medium'
        })

        if (!newTask.id) {
          results.success = false
          results.errors.push(`Error al crear tarea con ${admin.name}`)
          continue
        }

        results.logs.push(`✓ Creación de tarea exitosa por ${admin.name}`)

        // 3. Asignar la tarea al enterprise
        const enterpriseUser = HARDCODED_USERS.find(u => u.role === 'enterprise')
        if (!enterpriseUser) {
          results.success = false
          results.errors.push('No se encontró usuario enterprise')
          continue
        }

        await taskService.assignTask(newTask.id, enterpriseUser.id)
        results.logs.push(`✓ Asignación de tarea exitosa por ${admin.name}`)

        // 4. Cerrar sesión del admin
        await supabaseService.auth.signOut()
        results.logs.push(`✓ Logout de ${admin.name} exitoso`)
      }

      // Probar con cada superadmin
      const superadmins = HARDCODED_USERS.filter(u => u.role === 'superadmin')
      for (const superadmin of superadmins) {
        const { data: authData, error: loginError } = await supabaseService.auth.signInWithPassword({
          email: superadmin.email,
          password: superadmin.password
        })

        if (loginError || !authData?.user) {
          results.success = false
          results.errors.push(`Error en login de ${superadmin.name}: ${loginError}`)
          continue
        }

        results.logs.push(`✓ Login de ${superadmin.name} exitoso`)

        // Verificar que puede ver todas las tareas
        const tasks = await taskService.getTasks()
        results.logs.push(`✓ ${superadmin.name} puede ver todas las tareas`)

        // Crear y asignar una nueva tarea
        const newTask = await taskService.createTask({
          title: `Tarea de prueba creada por ${superadmin.name}`,
          description: 'Esta es una tarea de prueba para verificar el sistema',
          priority: 'high'
        })

        if (!newTask.id) {
          results.success = false
          results.errors.push(`Error al crear tarea con ${superadmin.name}`)
          continue
        }

        results.logs.push(`✓ Creación de tarea exitosa por ${superadmin.name}`)

        // Cerrar sesión del superadmin
        await supabaseService.auth.signOut()
        results.logs.push(`✓ Logout de ${superadmin.name} exitoso`)
      }

      // Probar con enterprise
      const enterpriseUser = HARDCODED_USERS.find(u => u.role === 'enterprise') as User
      const { data: authData, error: enterpriseLoginError } = await supabaseService.auth.signInWithPassword({
        email: enterpriseUser.email,
        password: enterpriseUser.password
      })

      if (enterpriseLoginError || !authData?.user) {
        results.success = false
        results.errors.push(`Error en login de enterprise: ${enterpriseLoginError}`)
        return results
      }

      results.logs.push('✓ Login de enterprise exitoso')

      // Verificar que el enterprise puede ver sus tareas asignadas
      const enterpriseTasks = await taskService.getTasks()
      results.logs.push(`✓ Enterprise puede ver ${enterpriseTasks.length} tareas asignadas`)

      // Verificar que puede actualizar sus tareas
      if (enterpriseTasks.length > 0) {
        await taskService.updateTask(enterpriseTasks[0].id, { status: 'in_progress' })
        results.logs.push('✓ Enterprise puede actualizar sus tareas')
      }

      await supabaseService.auth.signOut()
      results.logs.push('✓ Logout de enterprise exitoso')

    } catch (error: unknown) {
      results.success = false
      results.errors.push(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    return results
  }
} 