import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type WorkShift = Database['public']['Tables']['work_shifts']['Row']
type WorkShiftInsert = Database['public']['Tables']['work_shifts']['Insert']
type WorkShiftUpdate = Database['public']['Tables']['work_shifts']['Update']

export class WorkShiftService extends BaseService {
  /**
   * Obtiene un turno por ID
   */
  async getWorkShiftById(id: string): Promise<WorkShift> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .select('*')
        .eq('id', id)
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene los turnos de un área
   */
  async getWorkShiftsByArea(areaId: string): Promise<WorkShift[]> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .select('*')
        .eq('area_id', areaId)
        .order('start_time', { ascending: true })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene los turnos de un usuario
   */
  async getWorkShiftsByUser(userId: string): Promise<WorkShift[]> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Crea un nuevo turno
   */
  async createWorkShift(shiftData: Omit<WorkShiftInsert, 'created_at' | 'updated_at'>): Promise<WorkShift> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .insert({
          ...shiftData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Actualiza un turno
   */
  async updateWorkShift(id: string, shiftData: Partial<WorkShiftUpdate>): Promise<WorkShift> {
    try {
      const { data, error } = await this.supabase
        .from('work_shifts')
        .update({
          ...shiftData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Actualiza el estado de un turno
   */
  async updateWorkShiftStatus(id: string, status: WorkShift['status']): Promise<WorkShift> {
    return this.updateWorkShift(id, { status })
  }

  /**
   * Cancela un turno
   */
  async cancelWorkShift(id: string): Promise<WorkShift> {
    return this.updateWorkShift(id, { 
      status: 'cancelled'
    })
  }

  /**
   * Verifica conflictos de horario para un usuario
   */
  async checkScheduleConflicts(
    userId: string,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): Promise<boolean> {
    try {
      let query = this.supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)

      if (excludeShiftId) {
        query = query.neq('id', excludeShiftId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).length > 0
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const workShiftService = new WorkShiftService() 