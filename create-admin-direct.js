// Script simplified para crear un usuario administrador mediante SQL directo
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar que las credenciales estén definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en el archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Datos del usuario admin
const adminData = {
  id: uuidv4(), // Generar un nuevo UUID para el usuario
  email: 'admin.direct@example.com',
  firstName: 'Admin',
  lastName: 'Direct',
  organizationId: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584' // ID de organización especificado
};

async function createAdminDirectly() {
  console.log('Creando usuario administrador con inserción directa:');
  console.log(`- ID: ${adminData.id}`);
  console.log(`- Email: ${adminData.email}`);
  console.log(`- Nombre: ${adminData.firstName} ${adminData.lastName}`);
  console.log(`- ID de Organización: ${adminData.organizationId}`);

  try {
    // Intentar insertar directamente en la tabla users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: adminData.id,
        email: adminData.email,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        role: 'admin',
        organization_id: adminData.organizationId,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      })
      .select();

    if (error) {
      throw new Error(`Error insertando en tabla users: ${error.message}`);
    }

    console.log('Usuario administrador creado exitosamente mediante inserción directa.');
    console.log('Nota: Este usuario solo existe en la tabla de aplicación, no en auth.');
    console.log('Información del usuario:');
    console.log(data);

    return { success: true, data };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Intento alternativo: SQL raw
    console.log('Intentando con SQL crudo...');
    
    try {
      const { data, error } = await supabase.rpc('run_sql', {
        query: `
          INSERT INTO users (id, email, first_name, last_name, role, organization_id, status, created_at, updated_at)
          VALUES ('${adminData.id}', '${adminData.email}', '${adminData.firstName}', '${adminData.lastName}', 'admin', 
                '${adminData.organizationId}', 'active', now(), now())
          RETURNING *;
        `
      });
      
      if (error) {
        throw new Error(`Error con SQL crudo: ${error.message}`);
      }
      
      console.log('Usuario creado exitosamente mediante SQL crudo.');
      console.log(data);
      
      return { success: true, data };
    } catch (sqlError) {
      console.error(`Error final: ${sqlError.message}`);
      return { success: false, error: sqlError.message };
    }
  }
}

// Ejecutar la función
createAdminDirectly(); 