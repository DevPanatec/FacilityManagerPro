import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export const importExportService = {
  async importFromExcel(file) {
    try {
      console.log('1. Iniciando importación del archivo:', file.name);
      const data = await this.readExcelFile(file);
      console.log('2. Datos leídos del Excel:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('El archivo no contiene datos válidos');
      }

      const columns = Object.keys(data[0]);
      console.log('3. Columnas encontradas:', columns);

      // Transformar los datos
      const transformedData = data.map((item, index) => {
        console.log(`4. Procesando item ${index + 1}:`, item);
        
        // Obtener el nombre de cualquier campo disponible
        const nombreValue = item.name || item.nombre || item.NOMBRE || item.Name || item.COMPANY || item.company || '';
        
        const transformedItem = {
          name: nombreValue,      // Para el campo name
          nombre: nombreValue,    // Para el campo nombre (requerido)
          type: item.type || item.tipo || item.TYPE || item.TIPO || 'empresa',
          personal: parseInt(item.personal || item.PERSONAL || item.empleados || 0),
          areas: parseInt(item.areas || item.AREAS || item.departamentos || 0),
          servicios: parseInt(item.servicios || item.SERVICIOS || item.services || 0),
          status: 'active',
          active: true,
          config: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`5. Item ${index + 1} transformado:`, transformedItem);
        return transformedItem;
      });

      const validData = transformedData.filter(item => item.name.trim() !== '');
      console.log('6. Datos válidos a insertar:', validData);

      if (validData.length === 0) {
        throw new Error('No se encontraron datos válidos para importar');
      }

      // Insertar todos los datos de una vez
      console.log('7. Insertando datos en Supabase:', validData);
      const { data: result, error: insertError } = await supabase
        .from('organizations')
        .insert(validData)
        .select();

      if (insertError) {
        console.error('Error detallado de inserción:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(insertError.message || 'Error al insertar datos');
      }

      if (!result) {
        throw new Error('No se recibió respuesta de la inserción');
      }

      console.log('8. Datos insertados correctamente:', result);
      return { 
        success: true, 
        data: result,
        message: `Se importaron ${result.length} registros correctamente`
      };

    } catch (error) {
      console.error('Error completo en importación:', {
        message: error.message,
        stack: error.stack,
        error
      });
      return { 
        success: false, 
        error: error.message || 'Error durante la importación',
        details: error
      };
    }
  },

  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('Leyendo archivo...');
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);
          console.log('Datos del Excel:', data);
          resolve(data);
        } catch (error) {
          console.error('Error al procesar Excel:', error);
          reject(new Error('Error al procesar el archivo Excel: ' + error.message));
        }
      };

      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        reject(new Error('Error al leer el archivo: ' + error.message));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}; 