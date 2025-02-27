const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con rol de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del usuario que ya existe en la tabla users pero no en auth
const userData = {
  id: '3c162c5e-01af-4578-a70a-aa595707033b', // UUID específico que ya existe en la tabla users
  email: 'admin.workaround@facilitymanagerpro.com',
  password: 'SecurePass123!',
  email_confirm: true
};

async function createAuthUserWithUUID() {
  console.log('===== CREANDO USUARIO EN AUTH CON UUID ESPECÍFICO =====');
  console.log(`Email: ${userData.email}`);
  console.log(`UUID específico: ${userData.id}`);
  
  try {
    // Intento 1: Usando el API admin con UUID específico
    console.log('\n--- INTENTO 1: ADMIN API CON UUID ESPECÍFICO ---');
    try {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { existing_id: userData.id },
        // En algunas versiones de Supabase, se puede especificar el UUID directamente
        id: userData.id
      });

      if (adminError) {
        console.error('Error en intento 1:', adminError);
      } else {
        console.log('¡Éxito! Usuario creado con UUID específico:');
        console.log(adminData);
        return;
      }
    } catch (e) {
      console.error('Error en intento 1:', e.message);
    }

    // Intento 2: Intentar usar SQL directo (puede requerir permisos especiales)
    console.log('\n--- INTENTO 2: SQL DIRECTO (SIMULACIÓN) ---');
    try {
      console.log('Simulando inserción directa en auth.users con UUID específico...');
      console.log('Nota: Esta operación generalmente requiere permisos de superusuario en Postgres.');
      
      // Esta es una simulación - no se ejecutará realmente ya que probablemente no tengas permisos
      const sqlQuery = `
        INSERT INTO auth.users (
          id, email, encrypted_password, email_confirmed_at, created_at, updated_at, 
          raw_user_meta_data, raw_app_meta_data, is_super_admin, role_id
        ) VALUES (
          '${userData.id}', '${userData.email}', 'encrypted_password_hash', NOW(), NOW(), NOW(),
          '{"provider": "email", "existing_id": "${userData.id}"}', '{"provider": "email", "role": "admin"}', 
          false, (SELECT id FROM auth.roles WHERE name = 'authenticated')
        );
      `;
      
      console.log('SQL que necesitarías ejecutar (con permisos de superusuario):');
      console.log(sqlQuery);
    } catch (e) {
      console.error('Error en simulación SQL:', e.message);
    }
    
    console.log('\n===== RECOMENDACIONES FINALES =====');
    console.log('Si ninguno de los métodos automáticos funciona, considera las siguientes opciones:');
    console.log('1. Contactar al administrador de la base de datos para asistencia');
    console.log('2. Utilizar el usuario existente (admin@fmanager.com) temporalmente');
    console.log('3. Verificar si existe alguna función personalizada en Supabase para crear usuarios');
    console.log('4. Actualizar la aplicación para usar solo la tabla users sin depender de auth');
    console.log('5. Ejecutar SQL directo en la base de datos con permisos adecuados');
    
    // Mostrar usuarios existentes que podrían usarse
    console.log('\nBuscando usuarios existentes que podrías usar temporalmente:');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, organization_id')
      .eq('role', 'admin')
      .limit(5);
    
    if (usersError) {
      console.error('Error al buscar usuarios existentes:', usersError);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('Usuarios admin existentes que podrías usar:');
      existingUsers.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id}, Org: ${user.organization_id})`);
      });
    } else {
      console.log('No se encontraron usuarios admin existentes.');
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
createAuthUserWithUUID().catch(err => {
  console.error('Error fatal:', err);
}); 