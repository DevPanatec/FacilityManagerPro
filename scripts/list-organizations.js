// Script para listar todas las organizaciones en Supabase
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configuración para cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear el cliente de Supabase con la clave de servicio para tener acceso completo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Función para listar todas las organizaciones
async function listOrganizations() {
  try {
    console.log('Listando todas las organizaciones...');

    // Consultar la tabla organizations
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al listar las organizaciones:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No se encontraron organizaciones.');
      return [];
    }

    console.log(`\nSe encontraron ${data.length} organizaciones:\n`);
    
    // Imprimir información de cada organización
    data.forEach((org, index) => {
      console.log(`Organización #${index + 1}:`);
      console.log(`ID: ${org.id}`);
      console.log(`Nombre: ${org.name}`);
      console.log(`Status: ${org.status || 'No especificado'}`);
      console.log(`Creada: ${org.created_at}`);
      console.log(`Actualizada: ${org.updated_at}`);
      console.log('-----------------------------------');
    });
    
    return data;
  } catch (error) {
    console.error('Error inesperado:', error);
    return null;
  }
}

// Ejecutar la función
listOrganizations()
  .then((orgs) => {
    if (orgs) {
      console.log('Proceso completado correctamente.');
    } else {
      console.error('No se pudieron listar las organizaciones.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en la ejecución:', error);
    process.exit(1);
  }); 