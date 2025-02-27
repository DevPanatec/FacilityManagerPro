const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con clave de servicio (para operaciones administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Lista de correos de usuarios a verificar
const userEmails = [
  'admin1@hospitalintegrado.com',
  'admin2@hospitalintegrado.com',
  'admin3@hospitalintegrado.com',
  'admin4@hospitalintegrado.com',
  'admin5@hospitalintegrado.com',
  'coordinador1@hospitalintegrado.com',
  'coordinador2@hospitalintegrado.com',
  'coordinador3@hospitalintegrado.com'
];

// Contraseña por defecto establecida en el script SQL
const defaultPassword = 'Password123!';

// Función para verificar inicio de sesión
async function verifyLogin(email, password) {
  try {
    // Crear un cliente de Supabase específico para este intento de inicio de sesión
    const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.gPrqf-VBZAaVvBJZNnrITF1z17ik0pqt91pRGrtBWyo');
    
    console.log(`Intentando iniciar sesión con: ${email}`);
    
    // Intentar inicio de sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`  ❌ Error al iniciar sesión: ${error.message}`);
      
      // Verificar si el usuario existe en auth.users
      const { count, error: countError } = await supabaseAdmin.rpc('count_auth_users_by_email', {
        email_param: email
      });
      
      if (countError) {
        console.error(`  ❌ Error al verificar existencia en auth.users: ${countError.message}`);
      } else {
        console.log(`  ℹ️ Usuario existe en auth.users: ${count > 0 ? 'SÍ' : 'NO'}`);
      }
      
      return {
        email,
        success: false,
        error: error.message,
        exists_in_auth: count > 0
      };
    }
    
    console.log(`  ✅ Inicio de sesión exitoso para ${email}`);
    console.log(`  ℹ️ Datos del usuario: ${data.user.id}`);
    
    return {
      email,
      success: true,
      user_id: data.user.id
    };
  } catch (error) {
    console.error(`  ❌ Error general al verificar login: ${error.message}`);
    return {
      email,
      success: false,
      error: error.message
    };
  }
}

// Función para crear una RPC para contar usuarios en auth.users
async function createCountFunction() {
  try {
    // Verificar si la función ya existe
    const { data, error } = await supabaseAdmin.rpc('function_exists', {
      function_name: 'count_auth_users_by_email'
    });
    
    if (error) {
      console.error(`Error al verificar existencia de función: ${error.message}`);
      console.log('Creando función para contar usuarios...');
      
      // SQL para crear la función
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION count_auth_users_by_email(email_param TEXT)
        RETURNS INTEGER AS $$
        DECLARE
          user_count INTEGER;
        BEGIN
          SELECT COUNT(*)
          INTO user_count
          FROM auth.users
          WHERE email = email_param;
          
          RETURN user_count;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION count_auth_users_by_email TO service_role;
      `;
      
      console.log('Por favor, ejecuta el siguiente SQL en el editor SQL de Supabase:');
      console.log(createFunctionSQL);
    }
  } catch (error) {
    console.error(`Error general al crear función: ${error.message}`);
  }
}

// Función principal
async function verifyAllLogins() {
  console.log('===== VERIFICANDO INICIO DE SESIÓN DE USUARIOS =====');
  
  // Crear función auxiliar si no existe
  await createCountFunction();
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const email of userEmails) {
    console.log(`\n[${userEmails.indexOf(email) + 1}/${userEmails.length}] Verificando: ${email}`);
    
    // Verificar login
    const result = await verifyLogin(email, defaultPassword);
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Esperar un momento entre verificaciones
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Mostrar resumen
  console.log('\n===== RESUMEN DE VERIFICACIÓN =====');
  console.log(`Total procesados: ${userEmails.length}`);
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Fallidos: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nUsuarios con problemas:');
    results.failed.forEach(user => {
      console.log(`- ${user.email}: ${user.error}`);
    });
    
    console.log('\nPosibles soluciones:');
    console.log('1. Asegúrate de haber ejecutado el script SQL "verify-users-sql.sql" en el SQL Editor de Supabase');
    console.log('2. Verifica que los usuarios existen en la tabla auth.users');
    console.log('3. Comprueba que la contraseña por defecto es correcta: "Password123!"');
  }
  
  // Guardar resultados
  fs.writeFileSync('login-verification-results.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en login-verification-results.json');
  
  return results;
}

// Ejecutar
verifyAllLogins().catch(err => {
  console.error('Error fatal:', err);
}); 