import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Servicio para gestionar la carga de tareas de forma consistente en toda la aplicación
 */
export const taskService = {
  /**
   * Carga todas las tareas para una organización
   * @returns Un array con todas las tareas de la organización
   */
  async loadAllTasks() {
    const supabase = createClientComponentClient();
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // Obtener el perfil del usuario para acceder a la organización
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');
      
      console.log('Cargando todas las tareas para la organización:', userProfile.organization_id);
      
      // Consulta unificada para obtener todas las tareas activas (no canceladas)
      // Sin filtrar por tipo para asegurar que se incluyan todos los tipos ('assignment', 'calendar', etc.)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          start_date,
          start_time,
          end_time,
          due_date,
          type,
          sala_id,
          area_id,
          assigned_to,
          organization_id,
          users!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          areas (
            id,
            name
          ),
          salas (
            id,
            nombre
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      
      // Log para diagnóstico de tipos de tareas
      const taskTypes = tasksData ? [...new Set(tasksData.map(task => task.type))].filter(Boolean) : [];
      console.log('Tipos de tareas encontrados:', taskTypes);
      console.log('Total tareas cargadas:', tasksData?.length || 0);
      
      return tasksData || [];
    } catch (error) {
      console.error('Error cargando tareas:', error);
      throw error;
    }
  },
  
  /**
   * Filtra las tareas por fecha
   * @param tasks - Lista de tareas a filtrar
   * @param date - Fecha para filtrar (formato YYYY-MM-DD)
   * @returns Array de tareas que corresponden a la fecha especificada
   */
  filterTasksByDate(tasks, date) {
    // Asegurar que la fecha está en formato YYYY-MM-DD
    const targetDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    return tasks.filter(task => {
      // Primero intentar con due_date (esta es la fecha que debe usarse para el calendario)
      if (task.due_date) {
        const taskDate = new Date(task.due_date).toISOString().split('T')[0];
        return taskDate === targetDate;
      }
      
      // Si no hay due_date, intentar con start_date
      if (task.start_date) {
        const taskDate = new Date(task.start_date).toISOString().split('T')[0];
        return taskDate === targetDate;
      }
      
      // En último caso, intentar con created_at
      if (task.created_at) {
        const taskDate = new Date(task.created_at).toISOString().split('T')[0];
        return taskDate === targetDate;
      }
      
      return false;
    });
  },
  
  /**
   * Obtiene solo las tareas del día actual
   * @returns Un array con las tareas del día actual
   */
  async getTodayTasks() {
    const allTasks = await this.loadAllTasks();
    const today = new Date().toISOString().split('T')[0];
    return this.filterTasksByDate(allTasks, today);
  },
  
  /**
   * Carga las tareas para una sala específica
   * @param salaId ID de la sala
   * @returns Tareas filtradas para la sala especificada
   */
  async loadTasksBySala(salaId) {
    try {
      const allTasks = await this.loadAllTasks();
      return allTasks.filter(task => task.sala_id === salaId);
    } catch (error) {
      console.error(`Error cargando tareas para sala ${salaId}:`, error);
      throw error;
    }
  },
  
  /**
   * Carga todas las tareas y las agrupa por sala
   * @returns Array de salas con sus tareas asociadas
   */
  async loadTasksGroupedBySala() {
    const supabase = createClientComponentClient();
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // Obtener el perfil del usuario
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');
      
      // Cargar todas las salas
      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select(`
          id,
          nombre,
          areas (
            id,
            name,
            status
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (salasError) throw salasError;
      
      // Cargar todas las tareas
      const allTasks = await this.loadAllTasks();
      
      // Agrupar tareas por sala
      const salasWithTasks = salasData.map(sala => {
        const salaTasks = allTasks.filter(task => task.sala_id === sala.id);
        
        return {
          id: sala.id,
          nombre: sala.nombre,
          tareas: salaTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            created_at: new Date(task.created_at).toLocaleDateString(),
            due_date: task.due_date,
            assigned_to: task.assigned_to,
            assignee: task.users ? {
              first_name: task.users.first_name,
              last_name: task.users.last_name
            } : undefined
          })),
          areas: (sala.areas || [])
            .filter(area => area.status === 'active')
            .map(area => ({
              id: area.id,
              name: area.name
            }))
        };
      });
      
      return salasWithTasks;
    } catch (error) {
      console.error('Error cargando tareas agrupadas por sala:', error);
      throw error;
    }
  },
  
  /**
   * Carga todas las tareas del día actual y las agrupa por sala
   * @returns Array de salas con sus tareas asociadas filtradas por el día actual
   */
  async loadTodayTasksGroupedBySala() {
    const supabase = createClientComponentClient();
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      // Obtener el perfil del usuario
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userProfile) throw new Error('Perfil no encontrado');
      
      // Cargar todas las salas
      const { data: salasData, error: salasError } = await supabase
        .from('salas')
        .select(`
          id,
          nombre,
          areas (
            id,
            name,
            status
          )
        `)
        .eq('organization_id', userProfile.organization_id);

      if (salasError) throw salasError;
      
      // Cargar todas las tareas
      const allTasks = await this.loadAllTasks();
      
      // Filtrar solo las tareas de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = this.filterTasksByDate(allTasks, today);
      
      // Agrupar tareas por sala
      const salasWithTasks = salasData.map(sala => {
        const salaTasks = todayTasks.filter(task => task.sala_id === sala.id);
        
        return {
          id: sala.id,
          nombre: sala.nombre,
          tareas: salaTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            created_at: new Date(task.created_at).toLocaleDateString(),
            due_date: task.due_date,
            assigned_to: task.assigned_to,
            assignee: task.users ? {
              first_name: task.users.first_name,
              last_name: task.users.last_name
            } : undefined
          })),
          areas: (sala.areas || [])
            .filter(area => area.status === 'active')
            .map(area => ({
              id: area.id,
              name: area.name
            }))
        };
      });
      
      return salasWithTasks;
    } catch (error) {
      console.error('Error cargando tareas agrupadas por sala:', error);
      throw error;
    }
  }
}; 