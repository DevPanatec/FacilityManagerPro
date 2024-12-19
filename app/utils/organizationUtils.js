import { supabase } from '../config/supabaseClient';

export const importOrganizationData = async (jsonData) => {
  try {
    const { data, error } = await supabase
      .rpc('import_organization_data', { data: jsonData });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

export const exportOrganizationData = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .rpc('export_organization_data', { org_id: organizationId });
    
    if (error) throw error;
    
    // Convertir a diferentes formatos
    const downloadAsJson = () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization_${organizationId}.json`;
      a.click();
    };

    const downloadAsCsv = () => {
      // Implementar conversión a CSV
    };

    const downloadAsExcel = () => {
      // Implementar conversión a Excel
    };

    return {
      data,
      downloadAsJson,
      downloadAsCsv,
      downloadAsExcel
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}; 