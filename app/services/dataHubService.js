import { supabase } from '@/lib/supabase'

export const dataHubService = {
  async getDataHubSummary() {
    try {
      console.log('1. Iniciando getDataHubSummary...');
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('2. Datos recibidos de Supabase:', organizations);

      if (error) throw error;

      // Mapear los datos al formato esperado
      const formattedOrganizations = organizations.map(org => ({
        id: org.id,
        name: org.name,
        type: org.type,
        logo: null,
        personal: {
          total: org.personal || 0
        },
        areas: {
          total: org.areas || 0
        },
        actividad: {
          total: org.servicios || 0,
          label: 'servicios'
        },
        status: org.status,
        active: org.active
      }));

      const summary = {
        totalEmpresas: organizations.length,
        totalPersonal: organizations.reduce((sum, org) => sum + (org.personal || 0), 0),
        promedioActividad: organizations.reduce((sum, org) => sum + (org.servicios || 0), 0),
        totalIngresos: "$" + organizations.reduce((sum, org) => sum + ((org.servicios || 0) * 1000), 0).toLocaleString()
      };

      return {
        summary,
        organizations: formattedOrganizations
      };
    } catch (error) {
      console.error('Error en getDataHubSummary:', error);
      throw error;
    }
  },

  async deleteOrganization(id) {
    try {
      console.log('Service: Intentando eliminar organización con ID:', id);
      
      // Eliminar directamente usando RPC (función personalizada en Supabase)
      const { data, error } = await supabase.rpc('delete_organization', {
        organization_id: id
      });

      if (error) {
        console.error('Error al eliminar:', error);
        throw new Error('No se pudo eliminar la organización');
      }

      return { success: true };
    } catch (error) {
      console.error('Error en deleteOrganization:', error);
      throw error;
    }
  },

  async importExternalData() {
    try {
      // Aquí iría la lógica para importar datos de APIs externas
      const { data, error } = await supabase.rpc('import_external_data');
      
      if (error) throw error;
      return { success: true, message: 'Datos importados correctamente' };
    } catch (error) {
      console.error('Error al importar datos externos:', error);
      throw error;
    }
  },

  async importFromExcel(file) {
    try {
      const data = await readExcelFile(file);
      const { error } = await supabase.rpc('import_organization_data', {
        organizations: data
      });

      if (error) throw error;
      return { success: true, message: 'Datos importados desde Excel correctamente' };
    } catch (error) {
      console.error('Error al importar desde Excel:', error);
      throw error;
    }
  },

  async importFromCSV(file) {
    try {
      const data = await readCSVFile(file);
      const { error } = await supabase.rpc('import_organization_data', {
        organizations: data
      });

      if (error) throw error;
      return { success: true, message: 'Datos importados desde CSV correctamente' };
    } catch (error) {
      console.error('Error al importar desde CSV:', error);
      throw error;
    }
  },

  async importFromJSON(file) {
    try {
      const data = await readJSONFile(file);
      const { error } = await supabase.rpc('import_organization_data', {
        organizations: data
      });

      if (error) throw error;
      return { success: true, message: 'Datos importados desde JSON correctamente' };
    } catch (error) {
      console.error('Error al importar desde JSON:', error);
      throw error;
    }
  },

  // Funciones auxiliares para leer archivos
  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  async readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = text.split('\n');
          const headers = rows[0].split(',');
          const jsonData = rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((obj, header, i) => {
              obj[header.trim()] = values[i]?.trim();
              return obj;
            }, {});
          });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  async readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Función para exportar datos
  async exportData(format) {
    try {
      // Obtener todos los datos necesarios para la exportación
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
          *,
          staff:staff(total_empleados),
          areas:areas(total_areas),
          activities:activities(total_actividades, tipo_actividad),
          revenue:revenue(monto)
        `);

      if (error) throw error;

      // Formatear datos para exportación
      const exportData = organizations.map(org => ({
        nombre: org.nombre,
        personal: org.staff?.[0]?.total_empleados || 0,
        areas: org.areas?.[0]?.total_areas || 0,
        actividades: org.activities?.[0]?.total_actividades || 0,
        tipo_actividad: org.activities?.[0]?.tipo_actividad || '',
        ingresos: org.revenue?.[0]?.monto || 0
      }));

      // Exportar según el formato
      switch (format) {
        case 'excel':
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportData);
          XLSX.utils.book_append_sheet(wb, ws, 'Organizaciones');
          XLSX.writeFile(wb, 'organizaciones.xlsx');
          break;

        case 'csv':
          const ws_csv = XLSX.utils.json_to_sheet(exportData);
          const csv = XLSX.utils.sheet_to_csv(ws_csv);
          const blob_csv = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          saveAs(blob_csv, 'organizaciones.csv');
          break;

        case 'json':
          const jsonString = JSON.stringify(exportData, null, 2);
          const blob_json = new Blob([jsonString], { type: 'application/json' });
          saveAs(blob_json, 'organizaciones.json');
          break;

        default:
          throw new Error('Formato no soportado');
      }

      return { success: true };
    } catch (error) {
      console.error('Error al exportar datos:', error);
      throw error;
    }
  },

  async getAdminStats() {
    try {
      // Obtener estadísticas de usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count');

      // Obtener estadísticas de organizaciones
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');

      // Obtener importaciones recientes
      const { data: imports, error: importsError } = await supabase
        .from('imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError || orgsError || importsError) throw error;

      return {
        totalUsers: users[0].count,
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(org => org.active).length,
        recentImports: imports.map(imp => ({
          date: imp.created_at,
          user: imp.user_email,
          type: imp.file_type,
          records: imp.records_count,
          status: imp.status
        }))
      };
    } catch (error) {
      console.error('Error en getAdminStats:', error);
      throw error;
    }
  },

  async getRecentActivities() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo actividades recientes:', error);
      throw error;
    }
  }
}; 