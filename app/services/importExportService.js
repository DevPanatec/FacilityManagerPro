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

      // Transformar los datos de manera más flexible
      const transformedData = data.map((item, index) => {
        console.log(`4. Procesando item ${index + 1}:`, item);
        
        // Buscar cualquier campo que pueda ser el nombre
        const possibleNameFields = Object.keys(item).find(key => 
          key.toLowerCase().includes('name') || 
          key.toLowerCase().includes('nombre') || 
          key.toLowerCase().includes('empresa') ||
          key.toLowerCase().includes('company')
        );

        // Buscar cualquier campo que pueda ser el tipo
        const possibleTypeFields = Object.keys(item).find(key => 
          key.toLowerCase().includes('type') || 
          key.toLowerCase().includes('tipo') || 
          key.toLowerCase().includes('category') ||
          key.toLowerCase().includes('categoria')
        );

        // Buscar campos numéricos
        const numberFields = Object.entries(item).reduce((acc, [key, value]) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue)) {
            if (key.toLowerCase().includes('personal') || 
                key.toLowerCase().includes('empleados') || 
                key.toLowerCase().includes('workers')) {
              acc.personal = numValue;
            } else if (key.toLowerCase().includes('area') || 
                      key.toLowerCase().includes('departamento') || 
                      key.toLowerCase().includes('department')) {
              acc.areas = numValue;
            } else if (key.toLowerCase().includes('servicio') || 
                      key.toLowerCase().includes('actividad') || 
                      key.toLowerCase().includes('service')) {
              acc.servicios = numValue;
            }
          }
          return acc;
        }, {});

        const transformedItem = {
          name: item[possibleNameFields] || 'Empresa sin nombre',
          nombre: item[possibleNameFields] || 'Empresa sin nombre',
          type: item[possibleTypeFields] || 'empresa',
          personal: numberFields.personal || 0,
          areas: numberFields.areas || 0,
          servicios: numberFields.servicios || 0,
          status: 'active',
          active: true,
          config: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`5. Item ${index + 1} transformado:`, transformedItem);
        return transformedItem;
      });

      // Filtrar registros inválidos pero ser más permisivo
      const validData = transformedData.filter(item => item.name && item.name.trim() !== '');

      if (validData.length === 0) {
        throw new Error('No se encontraron datos válidos para importar');
      }

      // Insertar datos en lotes pequeños para evitar problemas
      const batchSize = 5;
      const results = [];
      
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        console.log(`7. Insertando lote ${Math.floor(i/batchSize) + 1}:`, batch);

        const { data: insertedData, error } = await supabase
          .from('organizations')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error en inserción:', error);
          throw error;
        }

        if (insertedData) {
          results.push(...insertedData);
        }
      }

      return { 
        success: true, 
        data: results,
        message: `Se importaron ${results.length} registros correctamente`
      };

    } catch (error) {
      console.error('Error completo en importación:', error);
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
  },

  async importFromCSV(file) {
    try {
      const text = await this.readFileAsText(file);
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index]?.trim();
          return obj;
        }, {});
      });

      return this.processImportData(data);
    } catch (error) {
      console.error('Error importando CSV:', error);
      throw error;
    }
  },

  async importFromJSON(file) {
    try {
      const text = await this.readFileAsText(file);
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('El archivo JSON debe contener un array de organizaciones');
      }

      return this.processImportData(data);
    } catch (error) {
      console.error('Error importando JSON:', error);
      throw error;
    }
  },

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  async processImportData(data) {
    const transformedData = data.map(item => ({
      name: item.name || item.nombre || item.NOMBRE || '',
      nombre: item.name || item.nombre || item.NOMBRE || '',
      type: item.type || item.tipo || 'empresa',
      personal: parseInt(item.personal || item.empleados || 0),
      areas: parseInt(item.areas || item.departamentos || 0),
      servicios: parseInt(item.servicios || item.actividades || 0),
      status: 'active',
      active: true,
      config: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const validData = transformedData.filter(item => item.name.trim() !== '');

    if (validData.length === 0) {
      throw new Error('No se encontraron datos válidos para importar');
    }

    const { data: result, error } = await supabase
      .from('organizations')
      .insert(validData)
      .select();

    if (error) throw error;

    return {
      success: true,
      data: result,
      message: `Se importaron ${result.length} registros correctamente`
    };
  }
}; 