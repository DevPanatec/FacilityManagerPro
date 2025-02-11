import { supabaseService } from '@/services/supabaseService'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export abstract class BaseService {
  protected supabase: SupabaseClient

  constructor() {
    this.supabase = supabaseService
  }

  protected handleError(error: any): never {
    console.error('Service error:', error)
    throw error
  }

  protected handleResponse<T>(data: T | null, error: any): T {
    if (error) {
      this.handleError(error)
    }
    if (!data) {
      throw new Error('No data returned')
    }
    return data
  }
} 