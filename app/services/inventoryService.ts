import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type InventoryUsage = Database['public']['Tables']['inventory_usage']['Row'] & {
  user_name?: string;
  user?: {
    first_name: string;
    last_name: string;
  } | null;
}
type InventoryRestock = Database['public']['Tables']['inventory_restock']['Row']

interface User {
  first_name: string
  last_name: string
}

interface UsageHistoryRecord {
  id: string
  inventory_id: string
  quantity: number
  user_id: string
  user_name: string
  date: string
  created_at: string
  updated_at: string
  user: User | null
}

interface RestockHistoryRecord {
  id: string
  inventory_id: string
  quantity: number
  supplier: string
  date: string
  created_at: string
  updated_at: string
}

interface CombinedHistoryRecord {
  id: string
  inventory_id: string
  quantity: number
  type: 'use' | 'restock'
  user_name?: string
  supplier?: string
  date: string
  created_at: string
  updated_at: string
  user?: User | null
}

export const inventoryService = {
  async getItems(organizationId: string) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  },

  async getUsageHistory(itemId: string): Promise<UsageHistoryRecord[]> {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data, error } = await supabase
        .from('inventory_usage')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name
          )
        `)
        .eq('inventory_id', itemId)
        .order('date', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedData: UsageHistoryRecord[] = (data || []).map(record => ({
        id: record.id,
        inventory_id: record.inventory_id || '',
        quantity: record.quantity,
        user_id: record.user_id || '',
        user_name: (record as any).user_name || 'Usuario',
        date: record.date || '',
        created_at: record.created_at || '',
        updated_at: record.updated_at || '',
        user: record.user ? {
          first_name: record.user.first_name || '',
          last_name: record.user.last_name || ''
        } : null
      }))

      return transformedData
    } catch (error) {
      console.error('Error fetching usage history:', error)
      throw error
    }
  },

  async getRestockHistory(itemId: string): Promise<RestockHistoryRecord[]> {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { data, error } = await supabase
        .from('inventory_restock')
        .select('*')
        .eq('inventory_id', itemId)
        .order('date', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedData: RestockHistoryRecord[] = (data || []).map(record => ({
        id: record.id,
        inventory_id: record.inventory_id || '',
        quantity: record.quantity,
        supplier: record.supplier || '',
        date: record.date || '',
        created_at: record.created_at || '',
        updated_at: record.updated_at || ''
      }))

      return transformedData
    } catch (error) {
      console.error('Error fetching restock history:', error)
      throw error
    }
  },

  async registerUsage(
    itemId: string,
    quantity: number,
    userId: string,
    date: string,
    userName: string,
    organizationId: string
  ) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // Primero verificamos el stock actual
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity, min_stock, organization_id')
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      if (!item) throw new Error('Item no encontrado')
      
      // Verificar si hay suficiente stock
      if (item.quantity < quantity) {
        throw new Error('No hay suficiente stock disponible')
      }

      // Registrar el uso
      const { error: usageError } = await supabase
        .from('inventory_usage')
        .insert({
          inventory_id: itemId,
          quantity,
          user_id: userId,
          user_name: userName,
          date,
          organization_id: item.organization_id
        })

      if (usageError) throw usageError

      // Actualizar el stock
      const newQuantity = item.quantity - quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : 
                 newQuantity <= item.min_stock ? 'low' : 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      return true
    } catch (error) {
      console.error('Error registering usage:', error)
      throw error
    }
  },

  async registerRestock(
    itemId: string,
    quantity: number,
    supplier: string,
    date: string,
    organizationId: string
  ) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // Primero verificamos que el item exista
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity, min_stock, organization_id')
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      if (!item) throw new Error('Item no encontrado')

      // Registrar la reposición
      const { error: restockError } = await supabase
        .from('inventory_restock')
        .insert({
          inventory_id: itemId,
          quantity,
          supplier,
          date,
          organization_id: item.organization_id
        })

      if (restockError) throw restockError

      // Actualizar el stock
      const newQuantity = item.quantity + quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : 
                 newQuantity <= item.min_stock ? 'low' : 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      return true
    } catch (error) {
      console.error('Error registering restock:', error)
      throw error
    }
  },

  async updateItem(
    itemId: string,
    data: Partial<InventoryItem>
  ) {
    const supabase = createClientComponentClient<Database>()
    
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(data)
        .eq('id', itemId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  },

  async getCombinedHistory(itemId: string): Promise<CombinedHistoryRecord[]> {
    const supabase = createClientComponentClient<Database>()
    
    try {
      // Obtener registros de uso
      const { data: usageData, error: usageError } = await supabase
        .from('inventory_usage')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name
          )
        `)
        .eq('inventory_id', itemId)

      if (usageError) throw usageError

      // Obtener registros de reposición
      const { data: restockData, error: restockError } = await supabase
        .from('inventory_restock')
        .select('*')
        .eq('inventory_id', itemId)

      if (restockError) throw restockError

      // Combinar y transformar los datos
      const combinedHistory: CombinedHistoryRecord[] = [
        ...(usageData || []).map(record => ({
          id: record.id,
          inventory_id: record.inventory_id || '',
          quantity: record.quantity,
          type: 'use' as const,
          user_name: (record as any).user_name || 'Usuario',
          date: record.date || new Date().toISOString(),
          created_at: record.created_at || new Date().toISOString(),
          updated_at: record.updated_at || new Date().toISOString(),
          user: record.user ? {
            first_name: record.user.first_name || '',
            last_name: record.user.last_name || ''
          } : null
        })),
        ...(restockData || []).map(record => ({
          id: record.id,
          inventory_id: record.inventory_id || '',
          quantity: record.quantity,
          type: 'restock' as const,
          supplier: record.supplier || '',
          date: record.date || new Date().toISOString(),
          created_at: record.created_at || new Date().toISOString(),
          updated_at: record.updated_at || new Date().toISOString()
        }))
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      return combinedHistory
    } catch (error) {
      console.error('Error fetching combined history:', error)
      throw error
    }
  }
} 