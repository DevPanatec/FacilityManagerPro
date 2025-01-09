import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export class OrganizationService extends BaseService {
  /**
   * Obtiene una organización por ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene todas las organizaciones
   */
  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Crea una nueva organización
   */
  async createOrganization(orgData: Omit<OrganizationInsert, 'created_at' | 'updated_at'>): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .insert({
          ...orgData,
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
   * Actualiza una organización
   */
  async updateOrganization(id: string, orgData: Partial<OrganizationUpdate>): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .update({
          ...orgData,
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
   * Desactiva una organización
   */
  async deactivateOrganization(id: string): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .update({
          status: 'inactive',
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
   * Busca organizaciones por nombre
   */
  async searchOrganizations(query: string): Promise<Organization[]> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const organizationService = new OrganizationService() 