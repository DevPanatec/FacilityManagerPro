import { BaseService } from './base.service'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Tipo ampliado para tareas con relaciones incluidas
export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string | null;
  organization_id: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  type: string;
  sala_id: string | null;
  area_id: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_notes: string | null;
  attachments: any | null;
  complexity: string | null;
  order: number | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  frequency: string | null;
  parent_task_id?: string | null;
  created_by: string;
  metadata?: { [key: string]: any } | null;  // Campo para datos adicionales
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };
  sala?: {
    id: string;
    nombre: string;
  };
  area?: {
    id: string;
    name: string;
  };
}

// Tipo para las opciones de filtrado
export interface TaskFilterOptions {
  userId?: string;
  salaId?: string;
  areaId?: string;
  status?: string;
  type?: string | string[];  // Ajustar para permitir string o string[]
  filterByUser?: boolean;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  statusFilter?: string; // Para compatibilidad con código antiguo
  includeAllTypes?: boolean; // Nuevo: opción para incluir todos los tipos
}

// Estructura de caché
interface TaskCache {
  tasks: TaskWithRelations[];
  timestamp: number;
  organizationId: string;
}

// Tiempo de expiración del caché (3 segundos)
const CACHE_EXPIRATION = 3000;

// Caché global
let tasksCache: TaskCache | null = null;

// Configurar un timer para invalidar el caché periódicamente (cada 30 segundos)
setInterval(() => {
  if (tasksCache) {
    console.log('Invalidando caché por tiempo: 30 segundos transcurridos');
    tasksCache = null;
  }
}, 30000);

export class TaskService extends BaseService {
  // Observable para notificar cambios
  private listeners: Array<() => void> = [];

  /**
   * Suscribirse a cambios en las tareas
   */
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a los suscriptores sobre cambios
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Obtiene todas las tareas de una organización con información completa
   * Implementa un caché para reducir consultas a la base de datos
   */
  async getAllTasks(organizationId: string, forceRefresh: boolean = false): Promise<TaskWithRelations[]> {
    // Verificar si tenemos datos en caché y si son válidos
    const now = Date.now();
    const isCacheValid = tasksCache && 
                        tasksCache.organizationId === organizationId && 
                        now - tasksCache.timestamp < CACHE_EXPIRATION;

    // Si el caché es válido y no se fuerza actualización, devolver datos del caché
    if (isCacheValid && !forceRefresh) {
      console.log(`Usando caché de tareas (${tasksCache!.tasks.length} tareas) - Edad: ${(now - tasksCache!.timestamp)/1000}s`);
      return tasksCache!.tasks;
    }

    // Si llegamos aquí, necesitamos obtener datos frescos
    console.log(`Consultando tareas frescas para organización ${organizationId}`);
    
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey (
            id, 
            first_name, 
            last_name, 
            avatar_url
          ),
          sala:salas (
            id,
            nombre
          ),
          area:areas (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      // Procesar datos y asegurar que type esté siempre definido
      const processedData = (data || []).map(task => {
        // Usar la función de normalización para asegurar consistencia
        return this.normalizeTask(task);
      });

      // Diagnóstico detallado por tipo para ayudar en la depuración
      console.log(`Todas las tareas obtenidas: ${processedData.length}`);
      
      const tasksByType: Record<string, number> = {};
      const tasksByStatus: Record<string, number> = {};
      const tasksBySala: Record<string, number> = {};
      
      processedData.forEach(task => {
        // Contar por tipo
        const type = task.type || 'sin_tipo';
        tasksByType[type] = (tasksByType[type] || 0) + 1;
        
        // Contar por estado
        const status = task.status || 'sin_status';
        tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
        
        // Contar por sala
        const salaId = task.sala_id || 'sin_sala';
        tasksBySala[salaId] = (tasksBySala[salaId] || 0) + 1;
      });
      
      console.log('Distribución de tareas por tipo:', tasksByType);
      console.log('Distribución de tareas por estado:', tasksByStatus);
      console.log('Distribución de tareas por sala:', tasksBySala);

      // Convertir a TaskWithRelations (ya está normalizado)
      const tasks = processedData;
      
      // Actualizar el caché con los nuevos datos
      tasksCache = {
        tasks: tasks,
        timestamp: Date.now(),
        organizationId
      };

      console.log(`Caché de tareas actualizado con ${tasks.length} tareas`);
      return tasks;
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      // Si hay un error, devolver el caché si existe, aunque sea expirado
      if (tasksCache && tasksCache.organizationId === organizationId) {
        console.warn('Devolviendo caché expirado debido a error de consulta');
        return tasksCache.tasks;
      }
      throw error;
    }
  }

  /**
   * Método específico para obtener tareas por tipo
   * NOTA: Este método es compatible con versiones anteriores, pero la implementación 
   * unificada recomienda no filtrar por tipo de forma predeterminada
   */
  async getTasksByType(
    organizationId: string,
    type: string | string[],
    options: Partial<TaskFilterOptions> = {}
  ): Promise<TaskWithRelations[]> {
    // Obtener todas las tareas desde el caché o BD
    const allTasks = await this.getAllTasks(organizationId);
    
    // Si se solicita incluir todos los tipos, omitir el filtro de tipo
    if (options.includeAllTypes) {
      console.log('Omitiendo filtro por tipo como se solicitó');
      return this.applyFilters(allTasks, { ...options, type: undefined });
    }
    
    // Filtrar por tipo - soporta un tipo o un array de tipos
    return this.applyFilters(allTasks, { ...options, type });
  }

  /**
   * Método para obtener tareas filtradas localmente (sin consultar BD nuevamente)
   * Esta es la función principal para obtener tareas con cualquier filtro
   */
  async getFilteredTasks(
    organizationId: string,
    options: TaskFilterOptions = {}
  ): Promise<TaskWithRelations[]> {
    // Obtener todas las tareas primero (desde caché o BD)
    const allTasks = await this.getAllTasks(organizationId);
    
    // IMPORTANTE: Por defecto ahora incluimos TODAS las tareas sin filtrar por tipo
    // a menos que se especifique explícitamente
    return this.applyFilters(allTasks, options);
  }

  /**
   * Aplicar filtros a una lista de tareas ya cargadas
   * Extraído para reutilizar la lógica de filtrado
   */
  private applyFilters(tasks: TaskWithRelations[], options: TaskFilterOptions = {}): TaskWithRelations[] {
    // Diagnóstico detallado para depuración
    console.log(`=== FILTRADO DE TAREAS ===`);
    console.log(`Aplicando filtros a ${tasks.length} tareas con opciones:`, JSON.stringify(options, null, 2));
    
    const filteredTasks = tasks.filter(task => {
      // Filtrar por usuario asignado
      if (options.filterByUser && options.userId && task.assigned_to !== options.userId) {
        return false;
      }
      
      // Filtrar por sala
      if (options.salaId && task.sala_id !== options.salaId) {
        return false;
      }
      
      // Filtrar por área
      if (options.areaId && task.area_id !== options.areaId) {
        return false;
      }
      
      // Filtrar por estado (compatibilidad con ambos nombres de parámetro)
      const statusFilter = options.status || options.statusFilter;
      if (statusFilter && statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      
      // Filtrado por tipo - Lógica mejorada
      if (options.type && options.type !== 'all') {
        // Si includeAllTypes está explícitamente establecido como true, no filtrar por tipo
        if (options.includeAllTypes === true) {
          // No filtramos por tipo, incluimos todo
          return true;
        }
        
        // De lo contrario, aplicamos el filtro de tipo
        if (Array.isArray(options.type)) {
          // Si es un array de tipos, verificar si el tipo de la tarea está incluido
          if (!options.type.includes(task.type)) {
            return false;
          }
        } else if (task.type !== options.type) {
          // Si es un solo tipo, verificar si coincide exactamente
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Ordenar por el campo especificado
      const orderBy = options.orderBy || 'created_at';
      const direction = options.orderDirection || 'desc';
      
      if (!a[orderBy as keyof TaskWithRelations] || !b[orderBy as keyof TaskWithRelations]) {
        return 0;
      }
      
      const valueA = a[orderBy as keyof TaskWithRelations];
      const valueB = b[orderBy as keyof TaskWithRelations];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
    
    // Diagnóstico de resultados
    console.log(`Resultado: ${filteredTasks.length} tareas después de filtrar`);
    if (filteredTasks.length > 0) {
      // Contar por tipo en resultados
      const resultTypeCount: Record<string, number> = {};
      filteredTasks.forEach(task => {
        const type = task.type || 'unknown';
        resultTypeCount[type] = (resultTypeCount[type] || 0) + 1;
      });
      console.log('Distribución de tipos en resultados:', resultTypeCount);
    }
    console.log(`=== FIN FILTRADO ===`);
    
    return filteredTasks;
  }

  /**
   * Método legacy para compatibilidad con código existente
   * Este método ahora respeta el tipo si se especifica, pero por defecto incluye todos los tipos
   */
  async getOrganizationTasks(
    organizationId: string, 
    options: TaskFilterOptions = {}
  ): Promise<TaskWithRelations[]> {
    console.log(`getOrganizationTasks - Solicitud con opciones:`, JSON.stringify(options, null, 2));
    
    // Lógica mejorada para manejar tipo e includeAllTypes:
    // 1. Si se especifica un tipo Y no se especifica includeAllTypes, solo mostramos ese tipo
    // 2. Si se especifica includeAllTypes=true explícitamente, mostramos todos los tipos sin importar 
    //    si se especificó un tipo
    // 3. Si no se especifica ni tipo ni includeAllTypes, por defecto mostramos todos los tipos
    
    const modifiedOptions: TaskFilterOptions = {
      ...options
    };
    
    // Si no se especifica includeAllTypes, decidimos su valor basado en si hay un tipo especificado
    if (options.includeAllTypes === undefined) {
      // Si hay un tipo especificado, NO incluimos todos por defecto
      if (options.type) {
        modifiedOptions.includeAllTypes = false;
        console.log(`getOrganizationTasks - Tipo especificado (${options.type}) sin includeAllTypes, filtrando solo por ese tipo`);
      } else {
        // Si no hay tipo especificado, SÍ incluimos todos por defecto
        modifiedOptions.includeAllTypes = true;
        console.log(`getOrganizationTasks - Sin tipo especificado, incluyendo todos los tipos por defecto`);
      }
    } else {
      console.log(`getOrganizationTasks - includeAllTypes=${options.includeAllTypes} especificado explícitamente`);
    }
    
    return this.getFilteredTasks(organizationId, modifiedOptions);
  }

  /**
   * Invalidar el caché para forzar una recarga fresca
   */
  invalidateCache() {
    tasksCache = null;
    console.log('Caché de tareas invalidado');
    // Notificar a los suscriptores
    this.notifyListeners();
  }
  
  /**
   * Método para crear una nueva tarea
   */
  async createNewTask(taskData: Omit<TaskInsert, 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      // Asegurar que type tenga un valor
      const dataToInsert = { ...taskData } as any;
      
      if (!dataToInsert.type) {
        if (dataToInsert.sala_id && dataToInsert.area_id) {
          dataToInsert.type = 'assignment';
        } else if (dataToInsert.start_date && dataToInsert.end_date) {
          dataToInsert.type = 'calendar_task';
        } else {
          dataToInsert.type = 'general';
        }
        console.log(`Creando tarea con tipo inferido: ${dataToInsert.type}`);
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          ...dataToInsert,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar el caché para forzar actualización
      this.invalidateCache();
      
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Método para actualizar una tarea existente
   */
  async updateExistingTask(id: string, taskData: Partial<TaskUpdate>): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar el caché para forzar actualización
      this.invalidateCache();
      
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Método para eliminar una tarea
   */
  async deleteExistingTask(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidar el caché para forzar actualización
      this.invalidateCache();
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Compatibilidad con versiones anteriores
   */
  async refreshTasks(organizationId: string): Promise<TaskWithRelations[]> {
    return this.getAllTasks(organizationId, true);
  }
  
  /**
   * Métodos compatibles con versiones anteriores
   */
  async getTasks(): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
  
  /**
   * Configurar suscripción en tiempo real para tareas
   */
  subscribeToTasks(organizationId: string): () => void {
    const channel = this.supabase
      .channel('tasks_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `organization_id=eq.${organizationId}`
      }, payload => {
        console.log('¡Cambio detectado en tareas!', payload);
        // Invalidar el caché automáticamente cuando hay cambios
        this.invalidateCache();
      })
      .subscribe();
      
    console.log(`Suscripción a cambios en tareas configurada para organización ${organizationId}`);
    
    // Retornar una función que cuando se llame, cancele la suscripción
    return () => {
      channel.unsubscribe();
      console.log(`Suscripción a cambios en tareas cancelada para organización ${organizationId}`);
    };
  }

  /**
   * Procesar una tarea para asegurar que todos los campos estén presentes
   * Esta función normaliza los datos para que sean consistentes en todas las secciones
   */
  private normalizeTask(task: any): TaskWithRelations {
    // Asegurar que el tipo está definido
    if (!task.type) {
      if (task.sala_id && task.area_id) {
        task.type = 'assignment';
      } else if (task.due_date || (task.start_date && task.end_date)) {
        task.type = 'calendar_task';
      } else {
        task.type = 'general';
      }
      console.log(`Normalizando tarea ${task.id}: asignando tipo ${task.type}`);
    }
    
    // Asegurar que todos los campos necesarios están presentes
    return {
      id: task.id,
      title: task.title || '',
      description: task.description || null,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      created_at: task.created_at || new Date().toISOString(),
      updated_at: task.updated_at || null,
      organization_id: task.organization_id,
      assigned_to: task.assigned_to || null,
      due_date: task.due_date || null,
      completed_at: task.completed_at || null,
      type: task.type,
      sala_id: task.sala_id || null,
      area_id: task.area_id || null,
      estimated_hours: task.estimated_hours || null,
      actual_hours: task.actual_hours || null,
      completion_notes: task.completion_notes || null,
      attachments: task.attachments || null,
      complexity: task.complexity || null,
      order: task.order || null,
      start_date: task.start_date || task.due_date || null,
      end_date: task.end_date || null,
      start_time: task.start_time || null,
      end_time: task.end_time || null,
      frequency: task.frequency || null,
      parent_task_id: task.parent_task_id || null,
      created_by: task.created_by || '',
      metadata: task.metadata || null,
      assignee: task.assignee,
      sala: task.sala,
      area: task.area
    };
  }

  async createTask(taskData: Omit<TaskInsert, 'created_at' | 'updated_at'>): Promise<Task> {
    return this.createNewTask(taskData);
  }

  async updateTask(id: string, taskData: Partial<TaskUpdate>): Promise<Task> {
    return this.updateExistingTask(id, taskData);
  }

  async deleteTask(id: string): Promise<void> {
    return this.deleteExistingTask(id);
  }
}

// Exportar una instancia única del servicio (singleton)
export const taskService = new TaskService();

// Variable para almacenar la función de limpieza de la suscripción
let cleanupSubscription: (() => void) | null = null;

export const configureTaskService = (organizationId: string): void => {
  // Limpiar suscripción anterior si existe
  if (cleanupSubscription) {
    cleanupSubscription();
    cleanupSubscription = null;
  }
  
  // Configurar nueva suscripción
  cleanupSubscription = taskService.subscribeToTasks(organizationId);
  console.log(`Configurada suscripción en tiempo real para tareas de organización: ${organizationId}`);
}; 