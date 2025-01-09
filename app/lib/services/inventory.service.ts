import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert']
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update']

export class InventoryService extends BaseService {
  /**
   * Obtiene todos los items de inventario
   */
  async getInventoryItems(organizationId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene un item por ID
   */
  async getInventoryItemById(id: string): Promise<InventoryItem> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Crea un nuevo item de inventario
   */
  async createInventoryItem(itemData: Omit<InventoryItemInsert, 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .insert({
          ...itemData,
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
   * Actualiza un item de inventario
   */
  async updateInventoryItem(id: string, itemData: Partial<InventoryItemUpdate>): Promise<InventoryItem> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .update({
          ...itemData,
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
   * Elimina un item de inventario
   */
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Busca items por nombre o descripción
   */
  async searchInventoryItems(query: string, organizationId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name')

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const inventoryService = new InventoryService() 