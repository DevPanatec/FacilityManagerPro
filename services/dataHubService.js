export const dataHubService = {
  // Obtener resumen y lista de organizaciones
  async getDataHubSummary() {
    try {
      const response = await fetch('/api/datahub/summary');
      if (!response.ok) throw new Error('Error al obtener datos');
      return await response.json();
    } catch (error) {
      throw new Error('Error al cargar los datos: ' + error.message);
    }
  },

  // Importar datos de APIs externas
  async importExternalData() {
    try {
      const response = await fetch('/api/datahub/import', { method: 'POST' });
      if (!response.ok) throw new Error('Error en la importación');
      return await response.json();
    } catch (error) {
      throw new Error('Error al importar datos externos: ' + error.message);
    }
  },

  // Importar desde Excel
  async importFromExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/datahub/import/excel', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Error en la importación');
      return await response.json();
    } catch (error) {
      throw new Error('Error al importar Excel: ' + error.message);
    }
  },

  // Importar desde CSV
  async importFromCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/datahub/import/csv', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Error en la importación');
      return await response.json();
    } catch (error) {
      throw new Error('Error al importar CSV: ' + error.message);
    }
  },

  // Importar desde JSON
  async importFromJSON(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/datahub/import/json', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Error en la importación');
      return await response.json();
    } catch (error) {
      throw new Error('Error al importar JSON: ' + error.message);
    }
  },

  // Eliminar una organización
  async deleteOrganization(id) {
    if (!id) {
      throw new Error('ID es requerido');
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error Supabase:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw error;
    }
  },

  // Agregar este método al dataHubService
  async deleteAllOrganizations() {
    try {
      // Primero obtener los IDs de las organizaciones visibles
      const { data: visibleOrgs } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (!visibleOrgs?.length) {
        return { success: true, message: 'No hay organizaciones para eliminar' };
      }

      // Mostrar confirmación con los nombres
      const names = visibleOrgs.map(org => org.name).join('\n- ');
      if (!confirm(`¿Estás seguro de eliminar estas organizaciones?\n\n- ${names}\n\nEsta acción no se puede deshacer.`)) {
        return { success: false, message: 'Operación cancelada' };
      }

      // Eliminar las organizaciones una por una
      let deletedCount = 0;
      for (const org of visibleOrgs) {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .match({ id: org.id });

        if (!error) {
          deletedCount++;
        }
      }

      return { 
        success: true, 
        message: `${deletedCount} de ${visibleOrgs.length} organizaciones eliminadas` 
      };
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error al eliminar las organizaciones: ' + error.message);
    }
  }
}; 