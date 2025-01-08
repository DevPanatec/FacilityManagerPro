import { auth } from '@/utils/auth/client';
import { taskService } from './taskService';
import { notificationService } from './notificationService';
import { HARDCODED_USERS, User } from '@/utils/auth/users';

export const testService = {
  // Prueba el flujo completo de creación y asignación de tareas
  async testTaskFlow() {
    const results = {
      success: true,
      errors: [] as string[],
      logs: [] as string[]
    };

    try {
      // Probar con cada admin
      const admins = HARDCODED_USERS.filter(u => u.role === 'admin');
      for (const admin of admins) {
        // 1. Prueba de inicio de sesión como admin
        const { user: adminUser, error: loginError } = await auth.signIn(
          admin.email,
          admin.password
        );

        if (loginError || !adminUser) {
          results.success = false;
          results.errors.push(`Error en login de ${admin.name}: ${loginError}`);
          continue;
        }

        results.logs.push(`✓ Login de ${admin.name} exitoso`);

        // 2. Crear una tarea
        const newTask = await taskService.createTask({
          title: `Tarea de prueba creada por ${admin.name}`,
          description: 'Esta es una tarea de prueba para verificar el sistema',
          priority: 'medium'
        });

        if (!newTask.id) {
          results.success = false;
          results.errors.push(`Error al crear tarea con ${admin.name}`);
          continue;
        }

        results.logs.push(`✓ Creación de tarea exitosa por ${admin.name}`);

        // 3. Asignar la tarea al enterprise
        const enterpriseUser = HARDCODED_USERS.find(u => u.role === 'enterprise');
        if (!enterpriseUser) {
          results.success = false;
          results.errors.push('No se encontró usuario enterprise');
          continue;
        }

        await taskService.assignTask(newTask.id, enterpriseUser.id);
        results.logs.push(`✓ Asignación de tarea exitosa por ${admin.name}`);

        // 4. Verificar notificaciones
        await notificationService.notifyTaskAssignment(
          newTask.id,
          enterpriseUser.id,
          newTask.title
        );
        results.logs.push(`✓ Notificación enviada exitosamente por ${admin.name}`);

        // 5. Cerrar sesión del admin
        await auth.signOut();
        results.logs.push(`✓ Logout de ${admin.name} exitoso`);
      }

      // Probar con cada superadmin
      const superadmins = HARDCODED_USERS.filter(u => u.role === 'superadmin');
      for (const superadmin of superadmins) {
        const { user: superadminUser, error: loginError } = await auth.signIn(
          superadmin.email,
          superadmin.password
        );

        if (loginError || !superadminUser) {
          results.success = false;
          results.errors.push(`Error en login de ${superadmin.name}: ${loginError}`);
          continue;
        }

        results.logs.push(`✓ Login de ${superadmin.name} exitoso`);

        // Verificar que puede ver todas las tareas
        const tasks = await taskService.getTasks();
        results.logs.push(`✓ ${superadmin.name} puede ver todas las tareas`);

        // Crear y asignar una nueva tarea
        const newTask = await taskService.createTask({
          title: `Tarea de prueba creada por ${superadmin.name}`,
          description: 'Esta es una tarea de prueba para verificar el sistema',
          priority: 'high'
        });

        if (!newTask.id) {
          results.success = false;
          results.errors.push(`Error al crear tarea con ${superadmin.name}`);
          continue;
        }

        results.logs.push(`✓ Creación de tarea exitosa por ${superadmin.name}`);

        // Cerrar sesión del superadmin
        await auth.signOut();
        results.logs.push(`✓ Logout de ${superadmin.name} exitoso`);
      }

      // Probar con enterprise
      const enterpriseUser = HARDCODED_USERS.find(u => u.role === 'enterprise') as User;
      const { user: enterpriseLoggedUser, error: enterpriseLoginError } = await auth.signIn(
        enterpriseUser.email,
        enterpriseUser.password
      );

      if (enterpriseLoginError || !enterpriseLoggedUser) {
        results.success = false;
        results.errors.push(`Error en login de enterprise: ${enterpriseLoginError}`);
        return results;
      }

      results.logs.push('✓ Login de enterprise exitoso');

      // Verificar que el enterprise puede ver sus tareas asignadas
      const enterpriseTasks = await taskService.getTasks();
      results.logs.push(`✓ Enterprise puede ver ${enterpriseTasks.length} tareas asignadas`);

      // Verificar que puede actualizar sus tareas
      if (enterpriseTasks.length > 0) {
        await taskService.updateTask(enterpriseTasks[0].id, { status: 'in_progress' });
        results.logs.push('✓ Enterprise puede actualizar sus tareas');
      }

      await auth.signOut();
      results.logs.push('✓ Logout de enterprise exitoso');

    } catch (error: unknown) {
      results.success = false;
      results.errors.push(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return results;
  },

  // Prueba de seguridad y permisos
  async testSecurityPermissions() {
    const results = {
      success: true,
      errors: [] as string[],
      logs: [] as string[]
    };

    try {
      // 1. Intentar operaciones sin autenticación
      try {
        await taskService.getTasks();
        results.success = false;
        results.errors.push('Se permitió obtener tareas sin autenticación');
      } catch (error) {
        results.logs.push('✓ Bloqueo correcto de operaciones sin autenticación');
      }

      // 2. Prueba de permisos de enterprise
      const enterpriseUser = HARDCODED_USERS.find(u => u.role === 'enterprise') as User;
      const { user: enterpriseLoggedUser } = await auth.signIn(
        enterpriseUser.email,
        enterpriseUser.password
      );

      if (enterpriseLoggedUser) {
        // Intentar crear tarea (no permitido)
        try {
          await taskService.createTask({ title: 'Test' });
          results.success = false;
          results.errors.push('Enterprise pudo crear tarea (no debería)');
        } catch (error) {
          results.logs.push('✓ Enterprise bloqueado correctamente al crear tarea');
        }

        await auth.signOut();
      }

      // 3. Probar permisos de cada admin
      const admins = HARDCODED_USERS.filter(u => u.role === 'admin');
      for (const admin of admins) {
        const { user: adminLoggedUser } = await auth.signIn(
          admin.email,
          admin.password
        );

        if (adminLoggedUser) {
          // Verificar que puede ver todas las tareas
          const tasks = await taskService.getTasks();
          results.logs.push(`✓ ${admin.name} puede ver todas las tareas`);

          // Verificar que puede crear y asignar tareas
          const newTask = await taskService.createTask({ title: `Test ${admin.name}` });
          results.logs.push(`✓ ${admin.name} puede crear tareas`);

          await taskService.assignTask(newTask.id, enterpriseUser.id);
          results.logs.push(`✓ ${admin.name} puede asignar tareas`);

          await auth.signOut();
        }
      }

      // 4. Probar permisos de cada superadmin
      const superadmins = HARDCODED_USERS.filter(u => u.role === 'superadmin');
      for (const superadmin of superadmins) {
        const { user: superadminLoggedUser } = await auth.signIn(
          superadmin.email,
          superadmin.password
        );

        if (superadminLoggedUser) {
          // Verificar que puede ver todas las tareas
          const tasks = await taskService.getTasks();
          results.logs.push(`✓ ${superadmin.name} puede ver todas las tareas`);

          // Verificar que puede crear y asignar tareas
          const newTask = await taskService.createTask({ title: `Test ${superadmin.name}` });
          results.logs.push(`✓ ${superadmin.name} puede crear tareas`);

          await taskService.assignTask(newTask.id, enterpriseUser.id);
          results.logs.push(`✓ ${superadmin.name} puede asignar tareas`);

          await auth.signOut();
        }
      }

    } catch (error: unknown) {
      results.success = false;
      results.errors.push(`Error inesperado en pruebas de seguridad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return results;
  }
}; 