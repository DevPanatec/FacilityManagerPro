// Script para crear una nueva organización en Supabase
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

// Obtener el nombre de la organización desde los argumentos de línea de comandos
const organizationName = process.argv[2];

if (!organizationName) {
  console.error('Error: Se requiere proporcionar un nombre para la organización');
  console.log('Uso: node scripts/create-organization.js "Nombre de la Organización"');
  process.exit(1);
}

// Función para crear una nueva organización
async function createOrganization(name) {
  try {
    console.log(`Creando organización: ${name}`);

    // Insertar en la tabla organizations
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        { 
          name: name,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear la organización:', error);
      return null;
    }

    console.log('Organización creada exitosamente:');
    console.log(`ID: ${data.id}`);
    console.log(`Nombre: ${data.name}`);
    console.log(`Status: ${data.status}`);
    console.log(`Creada: ${data.created_at}`);
    
    return data;
  } catch (error) {
    console.error('Error inesperado:', error);
    return null;
  }
}

// Ejecutar la función
createOrganization(organizationName)
  .then((org) => {
    if (org) {
      console.log('Proceso completado correctamente.');
    } else {
      console.error('No se pudo crear la organización.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en la ejecución:', error);
    process.exit(1);
  }); 