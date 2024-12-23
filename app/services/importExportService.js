import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export const importExportService = {
  async importFromExcel(file) {
    try {
      console.log('Leyendo archivo Excel...');
      const data = await this.readExcelFile(file);
      console.log('Datos leídos del Excel:', data);
      
      // Validar que los datos tengan la estructura correcta
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('El archivo no contiene datos válidos');
      }

      // Verificar que los datos tengan los campos necesarios
      const requiredFields = ['nombre', 'type', 'personal', 'areas', 'servicios'];
      const missingFields = requiredFields.filter(field => !data[0].hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      }

      // Enviar datos a Supabase
      console.log('Enviando datos a Supabase...');
      const { data: result, error } = await supabase
        .rpc('import_excel_data', { data });

      if (error) {
        console.error('Error de Supabase:', error);
        throw new Error(`Error de Supabase: ${JSON.stringify(error)}`);
      }

      console.log('Respuesta de Supabase:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error en importFromExcel:', error);
      return { 
        success: false, 
        error: error.message || 'Error durante la importación' 
      };
    }
  },

  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('Archivo leído, procesando...');
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);
          console.log('Datos procesados:', data);
          resolve(data);
        } catch (error) {
          console.error('Error al leer Excel:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('Error del FileReader:', error);
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}; 