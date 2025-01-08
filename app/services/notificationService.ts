import { supabase } from '@/utils/supabase/client';
import { auth } from '@/utils/auth/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed';
  read: boolean;
  created_at: string;
}

export const notificationService = {
  // Crear una notificación
  async createNotification(notification: Partial<Notification>): Promise<Notification> {
    try {
      const client = createClient();
      const { data, error } = await client
        .from('notifications')
        .insert([{
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  },

  // Obtener notificaciones del usuario actual
  async getUserNotifications(): Promise<Notification[]> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const client = createClient();
      const { data, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const client = createClient();
      const { error } = await client
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  // Notificar asignación de tarea
  async notifyTaskAssignment(taskId: string, assignedToId: string, taskTitle: string): Promise<void> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      await this.createNotification({
        user_id: assignedToId,
        title: 'Nueva tarea asignada',
        message: `Se te ha asignado la tarea: ${taskTitle}`,
        type: 'task_assigned'
      });
    } catch (error) {
      console.error('Error al notificar asignación de tarea:', error);
      throw error;
    }
  },

  // Notificar actualización de tarea
  async notifyTaskUpdate(taskId: string, assignedToId: string, taskTitle: string): Promise<void> {
    try {
      const user = auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      await this.createNotification({
        user_id: assignedToId,
        title: 'Tarea actualizada',
        message: `La tarea "${taskTitle}" ha sido actualizada`,
        type: 'task_updated'
      });
    } catch (error) {
      console.error('Error al notificar actualización de tarea:', error);
      throw error;
    }
  }
}; 