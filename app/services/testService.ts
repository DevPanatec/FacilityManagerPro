import { supabaseService } from './supabaseService'
import { taskService } from './taskService'

interface TestResult {
  test: string;
  status: 'passed' | 'failed';
  error?: string;
}

export const testService = {
  runTests: async (): Promise<TestResult[]> => {
    try {
      // Datos de prueba
      const admins = [
        { name: 'Admin Test', email: 'admin@test.com', password: 'test123' },
        { name: 'Admin Test 2', email: 'admin2@test.com', password: 'test123' }
      ]

      const users = [
        { name: 'User Test', email: 'user@test.com', password: 'test123' },
        { name: 'User Test 2', email: 'user2@test.com', password: 'test123' }
      ]

      const results: TestResult[] = []

      // Pruebas de administradores
      for (const admin of admins) {
        // 1. Prueba de inicio de sesión como admin
        const { data: authData, error: loginError } = await supabaseService.auth.signInWithPassword({
          email: admin.email,
          password: admin.password
        })

        if (loginError) {
          results.push({
            test: `Login admin ${admin.name}`,
            status: 'failed',
            error: loginError.message
          })
          continue
        }

        results.push({
          test: `Login admin ${admin.name}`,
          status: 'passed'
        })

        // 2. Prueba de obtención de perfil
        const { data: profile, error: profileError } = await supabaseService
          .from('users')
          .select('*')
          .eq('id', authData.user?.id)
          .single()

        if (profileError) {
          results.push({
            test: `Get profile admin ${admin.name}`,
            status: 'failed',
            error: profileError.message
          })
        } else {
          results.push({
            test: `Get profile admin ${admin.name}`,
            status: 'passed'
          })
        }

        // Cerrar sesión
        await supabaseService.auth.signOut()
      }

      // Pruebas de usuarios normales
      for (const user of users) {
        // 1. Prueba de inicio de sesión como usuario
        const { data: authData, error: loginError } = await supabaseService.auth.signInWithPassword({
          email: user.email,
          password: user.password
        })

        if (loginError) {
          results.push({
            test: `Login user ${user.name}`,
            status: 'failed',
            error: loginError.message
          })
          continue
        }

        results.push({
          test: `Login user ${user.name}`,
          status: 'passed'
        })

        // 2. Prueba de obtención de perfil
        const { data: profile, error: profileError } = await supabaseService
          .from('users')
          .select('*')
          .eq('id', authData.user?.id)
          .single()

        if (profileError) {
          results.push({
            test: `Get profile user ${user.name}`,
            status: 'failed',
            error: profileError.message
          })
        } else {
          results.push({
            test: `Get profile user ${user.name}`,
            status: 'passed'
          })
        }

        // Cerrar sesión
        await supabaseService.auth.signOut()
      }

      return results
    } catch (error) {
      console.error('Error running tests:', error)
      throw error
    }
  }
} 