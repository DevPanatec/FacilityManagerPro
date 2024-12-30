import { supabase } from '../lib/supabase'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Definir los tipos permitidos
const ORGANIZATION_TYPES = {
  EMPRESA: 'empresa',
  PROVEEDOR: 'proveedor',
  CLIENTE: 'cliente'
};

// Primero, asegurémonos de que las constantes estén bien definidas
const VALID_TYPES = {
  empresa: 'empresa',
  proveedor: 'proveedor',
  cliente: 'cliente'
};

export const dataHubService = {
  async getDataHubSummary() {
    try {
      // Obtener organizaciones
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')  // Seleccionar todos los campos
        .order('name');  // Ordenar por nombre

      // Si hay error, mostrar en consola pero devolver datos vacíos
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

      // Asegurar que organizations sea un array
      const orgs = organizations || [];

      // Calcular totales
      const summary = {
        totalEmpresas: orgs.length,
        totalPersonal: orgs.reduce((sum, org) => sum + (Number(org.personal) || 0), 0),
        promedioActividad: orgs.reduce((sum, org) => sum + (Number(org.servicios) || 0), 0),
        totalIngresos: "$0"
      };

      // Mapear organizaciones
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
      // Devolver estructura vacía en caso de error
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

  // Exportar datos
  async exportEnterpriseData(format = 'json') {
    try {
      const data = await this.getDataHubSummary()
      
      const exportData = {
        resumen: {
          totalEmpresas: data.summary.totalEmpresas,
          totalPersonal: data.summary.totalPersonal,
          promedioActividad: data.summary.promedioActividad,
          totalIngresos: data.summary.totalIngresos
        },
        empresas: data.organizations.map(org => ({
          id: org.id,
          nombre: org.nombre,
          estado: org.estado,
          personal: org.personal.total,
          areas: org.areas.total,
          actividad: org.actividad.total
        }))
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        saveAs(blob, 'marpesca_data.json')
      } else if (format === 'excel') {
        const wb = XLSX.utils.book_new()
        
        // Hoja de resumen
        const resumenWS = XLSX.utils.json_to_sheet([exportData.resumen])
        XLSX.utils.book_append_sheet(wb, resumenWS, 'Resumen')
        
        // Hoja de empresas
        const empresasWS = XLSX.utils.json_to_sheet(exportData.empresas)
        XLSX.utils.book_append_sheet(wb, empresasWS, 'Empresas')
        
        XLSX.writeFile(wb, 'marpesca_data.xlsx')
      } else if (format === 'csv') {
        // Para CSV, usamos XLSX para convertir a CSV
        const ws = XLSX.utils.json_to_sheet(exportData.empresas)
        const csv = XLSX.utils.sheet_to_csv(ws)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, 'marpesca_empresas.csv')
      }

      return exportData
    } catch (error) {
      console.error('Error en exportación:', error)
      throw new Error('Error al exportar los datos: ' + error.message)
    }
  },

  // Importar datos externos (mantenemos la funcionalidad por si se necesita después)
  async importExternalData() {
    try {
      const externalSources = [
        {
          name: 'Usuarios de Prueba',
          url: 'https://jsonplaceholder.typicode.com/users',
          type: 'REST'
        },
        {
          name: 'Datos de Usuario Aleatorio',
          url: 'https://randomuser.me/api/?results=5',
          type: 'REST'
        }
      ]

      const importedData = await Promise.all(
        externalSources.map(async (source) => {
          try {
            console.log(`Obteniendo datos de ${source.name}...`)
            const response = await axios.get(source.url)
            const data = response.data

            const { error } = await supabase
              .from('external_data_sources')
              .upsert({
                source_name: source.name,
                data: data,
                last_updated: new Date()
              })

            if (error) throw error

            return {
              source: source.name,
              status: 'éxito',
              data: data
            }
          } catch (error) {
            console.error(`Error con ${source.name}:`, error)
            return {
              source: source.name,
              status: 'error',
              error: error.message
            }
          }
        })
      )

      return importedData
    } catch (error) {
      console.error('Error en importación:', error)
      throw error
    }
  },

  // Importar desde Excel
  async importFromExcel(file) {
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            let importados = 0;

            for (const row of jsonData) {
              try {
                // Crear la organización
                const orgData = {
                  name: row.nombre?.toString().trim(),
                  type: row.type || 'empresa',
                  estado: row.estado || 'Activo',
                  logo_url: row.logo_url || null,
                  personal: row.personal || 0,
                  areas: row.areas || 0,
                  servicios: row.servicios || 0
                };

                const { error } = await supabase
                  .from('organizations')
                  .upsert(orgData);

                if (!error) {
                  importados++;
                }
              } catch (err) {
                console.error('Error en fila:', err);
              }
            }

            resolve({
              success: true,
              message: `Se importaron ${importados} organizaciones correctamente`
            });
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      throw new Error(`Error en la importación: ${error.message}`);
    }
  },

  // Importar desde CSV
  async importFromCSV(file) {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const csvData = e.target.result;
            const workbook = XLSX.read(csvData, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            console.log('Datos leídos del CSV:', jsonData);

            if (!jsonData || jsonData.length === 0) {
              throw new Error('El archivo está vacío o no tiene datos para importar');
            }

            for (const row of jsonData) {
              // Verificar nombre en cualquier formato
              const nombreValue = row.nombre || row.Nombre || row.NOMBRE;
              if (!nombreValue) {
                throw new Error('Falta el campo "nombre". Las columnas requeridas son: nombre, tipo');
              }

              // Preparar datos normalizando los campos
              const orgData = {
                name: nombreValue.trim(),
                type: (row.tipo || row.Tipo || row.TIPO || 'empresa').toLowerCase(),
                estado: (row.estado || row.Estado || row.ESTADO || 'Activo').trim(),
                logo_url: (row.logo || row.Logo || row.LOGO || null)?.trim()
              };

              // Validar el tipo
              if (!['empresa', 'proveedor', 'cliente'].includes(orgData.type)) {
                throw new Error(`El tipo "${orgData.type}" no es válido para "${orgData.name}". Use: empresa, proveedor o cliente`);
              }

              const { error } = await supabase
                .from('organizations')
                .upsert(orgData);

              if (error) {
                throw new Error(`Error al guardar ${orgData.name}: ${error.message}`);
              }
            }

            resolve({
              success: true,
              message: `Se importaron ${jsonData.length} organizaciones correctamente`
            });
          } catch (error) {
            console.error('Error procesando CSV:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsBinaryString(file);
      });
    } catch (error) {
      throw new Error(`Error en la importación: ${error.message}`);
    }
  },

  // Importar desde JSON
  async importFromJSON(file) {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            let jsonData = JSON.parse(e.target.result);
            
            // Convertir a array si es un objeto único o buscar la propiedad que contiene el array
            if (!Array.isArray(jsonData)) {
              jsonData = jsonData.organizations || jsonData.empresas || jsonData.data || [jsonData];
            }

            console.log('Datos leídos del JSON:', jsonData);

            if (!jsonData || jsonData.length === 0) {
              throw new Error('El archivo está vacío o no tiene datos para importar');
            }

            for (const row of jsonData) {
              // Verificar nombre en cualquier formato
              const nombreValue = row.nombre || row.Nombre || row.NOMBRE || row.name || row.Name || row.NAME;
              if (!nombreValue) {
                throw new Error('Falta el campo "nombre/name". Los campos requeridos son: nombre, tipo');
              }

              // Preparar datos normalizando los campos
              const orgData = {
                name: nombreValue.trim(),
                type: (row.tipo || row.Tipo || row.TIPO || row.type || row.Type || 'empresa').toLowerCase(),
                estado: (row.estado || row.Estado || row.ESTADO || row.status || row.Status || 'Activo').trim(),
                logo_url: (row.logo || row.Logo || row.LOGO || row.logo_url || row.logoUrl || null)?.trim()
              };

              // Validar el tipo
              if (!['empresa', 'proveedor', 'cliente'].includes(orgData.type)) {
                throw new Error(`El tipo "${orgData.type}" no es válido para "${orgData.name}". Use: empresa, proveedor o cliente`);
              }

              const { error } = await supabase
                .from('organizations')
                .upsert(orgData);

              if (error) {
                throw new Error(`Error al guardar ${orgData.name}: ${error.message}`);
              }
            }

            resolve({
              success: true,
              message: `Se importaron ${jsonData.length} organizaciones correctamente`
            });
          } catch (error) {
            console.error('Error procesando JSON:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
      });
    } catch (error) {
      throw new Error(`Error en la importación: ${error.message}`);
    }
  },

  // Añadir esta función al dataHubService
  async getTemplate(format) {
    try {
      // Plantilla con ejemplos más claros
      const templateData = [
        {
          nombre: "Empresa Ejemplo 1",
          type: "empresa",
          estado: "Activo",
          logo: "https://ejemplo.com/logo1.png"
        },
        {
          nombre: "Proveedor Ejemplo",
          type: "proveedor",
          estado: "Activo",
          logo: "https://ejemplo.com/logo2.png"
        },
        {
          nombre: "Cliente Ejemplo",
          type: "cliente",
          estado: "Inactivo",
          logo: ""
        }
      ];

      switch (format) {
        case 'excel':
          const wb = XLSX.utils.book_new();
          // Asegurar el orden de las columnas
          const headers = ['nombre', 'type', 'estado', 'logo'];
          const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
          
          // Añadir una hoja de instrucciones
          const instrucciones = [
            ['Instrucciones de uso:'],
            ['1. No modificar los nombres de las columnas'],
            ['2. El campo "nombre" es obligatorio'],
            ['3. El campo "type" debe ser: empresa, proveedor o cliente'],
            ['4. El campo "estado" es opcional (por defecto es "Activo")'],
            ['5. El campo "logo" es opcional (URL de la imagen)']
          ];
          const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
          
          XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");
          XLSX.utils.book_append_sheet(wb, ws, "Organizaciones");
          
          return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        case 'csv':
          const csvData = [
            'nombre,estado,logo,type',
            `Nombre de la Organización 1,Activo,https://url-del-logo.com,${ORGANIZATION_TYPES.EMPRESA}`,
            `Nombre de la Organización 2,Inactivo,https://url-del-logo2.com,${ORGANIZATION_TYPES.PROVEEDOR}`
          ].join('\n');
          return csvData;

        case 'json':
          return JSON.stringify(templateData, null, 2);

        default:
          throw new Error('Formato no soportado');
      }
    } catch (error) {
      console.error('Error generando plantilla:', error);
      throw new Error('Error al generar la plantilla: ' + error.message);
    }
  },

  // Agregar esta función al objeto dataHubService
  async deleteOrganization(id) {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, message: 'Empresa eliminada correctamente' };
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw new Error('Error al eliminar la empresa');
    }
  }
} 