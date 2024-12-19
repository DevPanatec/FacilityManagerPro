import { supabase } from '@/lib/supabase';

export const dataHubService = {
  async getDataHubSummary() {
    try {
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error al obtener organizaciones:', error);
        return {
          summary: {
            totalEmpresas: 0,
            totalPersonal: 0,
            promedioActividad: 0,
            totalIngresos: "$0"
          },
          organizations: []
        };
      }

      const orgs = organizations || [];
      const summary = {
        totalEmpresas: orgs.length,
        totalPersonal: orgs.reduce((sum, org) => sum + (Number(org.personal) || 0), 0),
        promedioActividad: orgs.reduce((sum, org) => sum + (Number(org.servicios) || 0), 0),
        totalIngresos: "$0"
      };

      const mappedOrgs = orgs.map(org => ({
        id: org.id,
        nombre: org.name || '',
        logo: org.logo_url || null,
        estado: org.estado || 'Activo',
        personal: {
          total: Number(org.personal) || 0,
          label: 'empleados'
        },
        areas: {
          total: Number(org.areas) || 0,
          label: 'áreas'
        },
        actividad: {
          total: Number(org.servicios) || 0,
          label: 'servicios'
        }
      }));

      return {
        summary,
        organizations: mappedOrgs
      };
    } catch (error) {
      console.error('Error en getDataHubSummary:', error);
      return {
        summary: {
          totalEmpresas: 0,
          totalPersonal: 0,
          promedioActividad: 0,
          totalIngresos: "$0"
        },
        organizations: []
      };
    }
  },

  async deleteOrganization(id) {
    if (!id) {
      throw new Error('ID es requerido para eliminar una organización');
    }

    try {
      // Primero verificamos si la organización existe
      const { data: exists, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError || !exists) {
        throw new Error('La organización no existe');
      }

      // Si existe, procedemos a eliminarla
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error de Supabase:', deleteError);
        throw new Error(deleteError.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw error;
    }
  },

  // ... otros métodos existentes
}; 