import { supabase } from '../lib/supabase'

export const organizationService = {
  // Obtener todas las organizaciones
  async getOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        logo_url,
        estado,
        ultima_actualizacion,
        areas!inner(id)
      `)
      .order('name')
    
    if (error) throw error
    return data
  },

  // Crear una organización
  async createOrganization(organizationData) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: organizationData.nombre,
        logo_url: organizationData.logo_url,
        estado: 'Activo'
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Actualizar una organización
  async updateOrganization(id, updates) {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: updates.nombre,
        logo_url: updates.logo_url,
        estado: updates.estado,
        ultima_actualizacion: new Date()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Eliminar una organización
  async deleteOrganization(id) {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  }
} 