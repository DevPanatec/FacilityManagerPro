import { supabase } from '@/app/config/supabaseClient'

export const dataHubService = {
  async getData() {
    const { data, error } = await supabase
      .from('data_hub')
      .select('*')
    
    if (error) throw error
    return data
  },

  async saveData(data) {
    const { error } = await supabase
      .from('data_hub')
      .insert(data)
    
    if (error) throw error
    return true
  },

  async updateData(id, data) {
    const { error } = await supabase
      .from('data_hub')
      .update(data)
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async deleteData(id) {
    const { error } = await supabase
      .from('data_hub')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async getDataHubSummary() {
    try {
      const { data, error } = await supabase
        .from('data_hub_summary')
        .select('*')
        .single()

      if (error) throw error

      // Si no hay datos, devolver estructura por defecto
      return data || {
        summary: {
          totalEmpresas: 0,
          totalPersonal: 0,
          promedioActividad: 0,
          totalIngresos: "$0"
        },
        organizations: []
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
      throw error
    }
  },

  async deleteOrganization(id) {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async importFromExcel(file) {
    // Implementar lógica de importación de Excel
    return { message: 'Importación de Excel completada' }
  },

  async importFromCSV(file) {
    // Implementar lógica de importación de CSV
    return { message: 'Importación de CSV completada' }
  },

  async importFromJSON(file) {
    // Implementar lógica de importación de JSON
    return { message: 'Importación de JSON completada' }
  },

  async importExternalData() {
    // Implementar lógica de importación de APIs externas
    return { message: 'Importación de datos externos completada' }
  }
} 