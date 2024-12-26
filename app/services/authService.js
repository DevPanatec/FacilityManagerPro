import { supabase } from '@/lib/supabase';

export const authService = {
  // Autenticación
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Gestión de roles y permisos
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role;
    } catch (error) {
      console.error('Error obteniendo rol:', error);
      throw error;
    }
  },

  // Logs de actividades
  async logActivity(userId, action, details) {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          details,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error registrando actividad:', error);
      throw error;
    }
  },

  // Validación de permisos
  async checkPermission(userId, permission) {
    try {
      const role = await this.getUserRole(userId);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .eq('permission', permission)
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      throw error;
    }
  },

  // Agregar esta función
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      throw error;
    }
  }
}; 