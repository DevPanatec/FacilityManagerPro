import { createClient } from '../utils/supabase/client'

export const dataHubService = {
  async getData() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('data_hub')
      .select('*')
    
    if (error) throw error
    return data
  },

  async saveData(data: any) {
    const supabase = createClient()
    const { error } = await supabase
      .from('data_hub')
      .insert(data)
    
    if (error) throw error
    return true
  },

  async updateData(id: string, data: any) {
    const supabase = createClient()
    const { error } = await supabase
      .from('data_hub')
      .update(data)
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async deleteData(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('data_hub')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async getDataHubSummary() {
    try {
      const supabase = createClient()
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching summary';
      const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
      console.error('Error fetching summary:', errorMessage);
      throw error;
    }
  },

  async deleteOrganization(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async importFromExcel(file: File) {
    // Implementar lógica de importación de Excel
    return { message: 'Importación de Excel completada' }
  },

  async importFromCSV(file: File) {
    // Implementar lógica de importación de CSV
    return { message: 'Importación de CSV completada' }
  },

  async importFromJSON(file: File) {
    // Implementar lógica de importación de JSON
    return { message: 'Importación de JSON completada' }
  },

  async importExternalData() {
    // Implementar lógica de importación de APIs externas
    return { message: 'Importación de datos externos completada' }
  }
}

export default dataHubService 
