// Script para crear un usuario administrador usando SQL directo
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar que las credenciales estén definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en el archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generar un timestamp para crear un email único y una contraseña segura
const timestamp = new Date().getTime();
const password = `Admin${crypto.randomBytes(4).toString('hex')}!`;
const email = `admin_${timestamp}@example.com`;

// Datos del usuario
const adminData = {
  email: email,
  firstName: 'Admin',
  lastName: 'User',
  password: password,
  organizationId: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'
};

async function createAdminWithSQL() {
  console.log('Creando usuario administrador con los siguientes datos:');
  console.log(`- Email: ${adminData.email}`);
  console.log(`- Nombre: ${adminData.firstName} ${adminData.lastName}`);
  console.log(`- ID de Organización: ${adminData.organizationId}`);
  console.log(`- Contraseña: ${adminData.password}`);

  try {
    // Crear usuario con SQL directo utilizando RPC (Remote Procedure Call)
    const { data, error } = await supabase.rpc('create_admin_user', {
      p_email: adminData.email,
      p_password: adminData.password,
      p_first_name: adminData.firstName,
      p_last_name: adminData.lastName,
      p_organization_id: adminData.organizationId
    });

    if (error) {
      console.error('Error al ejecutar la función RPC:', error);
      
      // Alternativa: crear primero el usuario de autenticación
      console.log('Intentando método alternativo...');
      
      // 1. Crear usuario en auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true
      });
      
      if (authError) {
        throw new Error(`Error creando usuario en auth: ${authError.message}`);
      }
      
      console.log(`Usuario creado en auth.users con ID: ${authUser.user.id}`);
      
      // 2. Insertar directamente en la tabla de usuarios con SQL crudo
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          INSERT INTO users (id, email, first_name, last_name, role, organization_id, status, created_at, updated_at)
          VALUES ('${authUser.user.id}', '${adminData.email}', '${adminData.firstName}', '${adminData.lastName}', 'admin', 
                 '${adminData.organizationId}', 'active', now(), now());
        `
      });
      
      if (sqlError) {
        console.error('Error al insertar usuario con SQL directo:', sqlError);
        
        // Último intento: insertar usando la API de datos
        console.log('Intentando inserción directa en la tabla users...');
        
        const { data: insertResult, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: adminData.email,
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            role: 'admin',
            organization_id: adminData.organizationId,
            status: 'active'
          });
          
        if (insertError) {
          throw new Error(`Error final insertando en users: ${insertError.message}`);
        }
        
        console.log('Usuario administrador creado exitosamente mediante inserción directa.');
        console.log(`Credenciales: Email: ${adminData.email}, Contraseña: ${adminData.password}`);
        return { success: true, message: 'Usuario creado por método de inserción directa' };
      }
      
      console.log('Usuario administrador creado exitosamente mediante SQL crudo.');
      console.log(`Credenciales: Email: ${adminData.email}, Contraseña: ${adminData.password}`);
      return { success: true, message: 'Usuario creado por método de SQL directo' };
    }
    
    console.log('Usuario administrador creado exitosamente mediante RPC.');
    console.log(`Credenciales: Email: ${adminData.email}, Contraseña: ${adminData.password}`);
    return { success: true, message: 'Usuario creado por método RPC' };
  } catch (error) {
    console.error(`Error en proceso de creación: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Ejecutar la función
createAdminWithSQL(); 