import { supabase } from './supabase'

export const empresasAPI = {
  // Obtener todas las empresas con sus datos relacionados
  async getEmpresas() {
    const { data: empresas, error } = await supabase
      .from('organizations')
      .select(`
        *,
        staff_shifts(
          id,
          staff_id,
          shift_id
        ),
        tasks(
          id,
          title,
          description,
          status
        ),
        documents(
          id,
          title,
          file_url
        ),
        cleaning_checklists(
          id,
          title,
          status
        )
      `)
      .order('name')

    if (error) throw error
    return empresas
  },

  // Crear una nueva organización
  async createOrganization(orgData) {
    // Insertar en organizations
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: orgData.nombre,
        logo_url: orgData.logo,
        status: orgData.estado,
        // Añade otros campos según tu esquema
      }])
      .select()
      .single()

    if (orgError) throw orgError

    // Crear registros relacionados en otras tablas según sea necesario
    if (orgData.tasks && orgData.tasks.length > 0) {
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(orgData.tasks.map(task => ({
          organization_id: org.id,
          title: task.title,
          description: task.description,
          status: task.status
        })))

      if (tasksError) throw tasksError
    }

    // Crear documentos si existen
    if (orgData.documents && orgData.documents.length > 0) {
      const { error: docsError } = await supabase
        .from('documents')
        .insert(orgData.documents.map(doc => ({
          organization_id: org.id,
          title: doc.title,
          file_url: doc.file_url
        })))

      if (docsError) throw docsError
    }

    return org
  },

  // Actualizar una organización existente
  async updateOrganization(id, orgData) {
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: orgData.nombre,
        logo_url: orgData.logo,
        status: orgData.estado,
        // Actualiza otros campos según necesites
      })
      .eq('id', id)

    if (orgError) throw orgError

    // Actualizar tareas si es necesario
    if (orgData.tasks) {
      // Primero eliminar tareas existentes
      await supabase
        .from('tasks')
        .delete()
        .eq('organization_id', id)

      // Luego insertar las nuevas
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(orgData.tasks.map(task => ({
          organization_id: id,
          title: task.title,
          description: task.description,
          status: task.status
        })))

      if (tasksError) throw tasksError
    }

    // Actualizar documentos si es necesario
    if (orgData.documents) {
      await supabase
        .from('documents')
        .delete()
        .eq('organization_id', id)

      const { error: docsError } = await supabase
        .from('documents')
        .insert(orgData.documents.map(doc => ({
          organization_id: id,
          title: doc.title,
          file_url: doc.file_url
        })))

      if (docsError) throw docsError
    }
  },

  // Eliminar una organización
  async deleteOrganization(id) {
    // Debido a las restricciones de clave foránea, 
    // asegúrate de que las tablas relacionadas tengan ON DELETE CASCADE
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Funciones adicionales para manejar importación/exportación
  async importFromExcel(file) {
    // Implementar lógica de importación desde Excel
  },

  async exportToExcel(data) {
    // Implementar lógica de exportación a Excel
  },

  // Funciones para manejar documentos
  async uploadDocument(orgId, file) {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(`org_${orgId}/${file.name}`, file)

    if (error) throw error
    return data
  },

  // Obtener estadísticas
  async getOrganizationStats(orgId) {
    const { data, error } = await supabase
      .from('document_statistics')
      .select('*')
      .eq('organization_id', orgId)

    if (error) throw error
    return data
  }
} 