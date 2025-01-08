import { dbOperations } from '@/utils/supabase/client';
import { auth } from '@/utils/auth/client';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export const taskService = {
  // Obtener tareas según el rol del usuario
  async getTasks(): Promise<Task[]> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const tasks = await dbOperations.getTasks();

      // Filtrar tareas según el rol
      if (user.role === 'enterprise') {
        // Enterprise solo ve sus tareas asignadas
        return tasks.filter(task => task.assigned_to === user.id);
      } else {
        // Admin y Superadmin ven todas las tareas
        return tasks;
      }
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      throw error;
    }
  },

  // Crear una nueva tarea
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const newTask = {
        ...taskData,
        created_by: user.id,
        status: taskData.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return await dbOperations.createTask(newTask);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  },

  // Actualizar una tarea existente
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar permisos
      if (user.role === 'enterprise') {
        const task = await dbOperations.getTasks();
        const userTask = task.find(t => t.id === id);
        if (!userTask || userTask.assigned_to !== user.id) {
          throw new Error('No tienes permiso para modificar esta tarea');
        }
      }

      const updatedTask = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      return await dbOperations.updateTask(id, updatedTask);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  },

  // Eliminar una tarea
  async deleteTask(id: string): Promise<boolean> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Solo admin y superadmin pueden eliminar tareas
      if (user.role === 'enterprise') {
        throw new Error('No tienes permiso para eliminar tareas');
      }

      return await dbOperations.deleteTask(id);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  },

  // Asignar una tarea a un usuario
  async assignTask(taskId: string, userId: string): Promise<Task> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Solo admin y superadmin pueden asignar tareas
      if (user.role === 'enterprise') {
        throw new Error('No tienes permiso para asignar tareas');
      }

      return await dbOperations.updateTask(taskId, {
        assigned_to: userId,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al asignar tarea:', error);
      throw error;
    }
  }
}; 