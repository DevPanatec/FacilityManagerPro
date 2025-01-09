import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { errorHandler } from '@/utils/errorHandler'

const supabase = createClientComponentClient<Database>()

export const supabaseService = {
  // Autenticación
  auth: {
    async login(email: string, password: string) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        return data
      } catch (error) {
        errorHandler.logError('auth.login', error)
        throw error
      }
    },

    async logout() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      } catch (error) {
        errorHandler.logError('auth.logout', error)
        throw error
      }
    },

    async getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
      } catch (error) {
        errorHandler.logError('auth.getUser', error)
        throw error
      }
    }
  },

  // Usuarios
  users: {
    async getAll(filters = {}) {
      try {
        let query = supabase
          .from('users')
          .select('*')
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) query = query.eq(key, value)
        })

        const { data, error } = await query
        if (error) throw error
        return data
      } catch (error) {
        errorHandler.logError('users.getAll', error)
        throw error
      }
    },

    async create(userData: any) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select()
        if (error) throw error
        return data[0]
      } catch (error) {
        errorHandler.logError('users.create', error)
        throw error
      }
    }
  },

  // Dashboard
  dashboard: {
    async getStats(organizationId: string, period = 'week') {
      try {
        const now = new Date()
        const startDate = new Date()
        
        switch(period) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        const { data, error } = await supabase
          .from('analytics_data')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error
        return data
      } catch (error) {
        errorHandler.logError('dashboard.getStats', error)
        throw error
      }
    }
  },

  // Reportes
  reports: {
    async getAll(filters = {}) {
      try {
        let query = supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) query = query.eq(key, value)
        })

        const { data, error } = await query
        if (error) throw error
        return data
      } catch (error) {
        errorHandler.logError('reports.getAll', error)
        throw error
      }
    },

    async create(reportData: any) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([reportData])
          .select()
        if (error) throw error
        return data[0]
      } catch (error) {
        errorHandler.logError('reports.create', error)
        throw error
      }
    }
  },

  // Helper para queries genéricos
  query: {
    async select(table: string, query = '*', filters = {}) {
      try {
        let queryBuilder = supabase
          .from(table)
          .select(query)
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryBuilder = queryBuilder.eq(key, value)
        })

        const { data, error } = await queryBuilder
        if (error) throw error
        return data
      } catch (error) {
        errorHandler.logError(`query.select.${table}`, error)
        throw error
      }
    },

    async insert(table: string, data: any) {
      try {
        const { data: result, error } = await supabase
          .from(table)
          .insert([data])
          .select()
        if (error) throw error
        return result[0]
      } catch (error) {
        errorHandler.logError(`query.insert.${table}`, error)
        throw error
      }
    }
  }
} 