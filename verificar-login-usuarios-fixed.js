const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.gPrqf-VBZAaVvBJZNnrITF1z17ik0pqt91pRGrtBWyo';

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

// Función para verificar si un usuario existe en la tabla auth.users
async function checkUserInAuth(email) {
  try {
    console.log(`  Verificando si ${email} existe en auth.users...`);
    
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      // Si no podemos acceder directamente a auth.users, intentar con otra consulta
      console.log(`  No se puede consultar auth.users directamente, intentando otra forma...`);
      
      // Intentar con una consulta a través de rpc o consultando otra tabla que nos dé esta info
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (userError || !userData) {
        console.error(`  Error al verificar usuario en public.users: ${userError?.message || 'No encontrado'}`);
        return { exists: false, id: null };
      }
      
      return { exists: true, id: userData.id };
    }
    
    return { exists: data !== null, id: data?.id };
  } catch (error) {
    console.error(`  Error al verificar existencia en auth: ${error.message}`);
    return { exists: false, id: null };
  }
}

// Función para verificar inicio de sesión
async function verifyLogin(email, password) {
  try {
    // Crear un cliente de Supabase específico para este intento de inicio de sesión
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`Intentando iniciar sesión con: ${email}`);
    
    // Verificar si el usuario existe en auth.users
    const authCheck = await checkUserInAuth(email);
    console.log(`  Usuario existe en auth.users: ${authCheck.exists ? 'SÍ' : 'NO'}`);
    
    if (!authCheck.exists) {
      console.log(`  ❌ Usuario no encontrado en auth.users, no se puede iniciar sesión`);
      return {
        email,
        success: false,
        error: 'Usuario no existe en auth.users',
        exists_in_auth: false
      };
    }
    
    // Intentar inicio de sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`  ❌ Error al iniciar sesión: ${error.message}`);
      
      // Verificar si hay detalles adicionales
      if (error.message.includes('Invalid login credentials')) {
        console.log(`  ℹ️ Credenciales inválidas. Posible contraseña incorrecta.`);
      } else if (error.message.includes('Email not confirmed')) {
        console.log(`  ℹ️ Email no confirmado. Necesita verificación.`);
      }
      
      return {
        email,
        success: false,
        error: error.message,
        exists_in_auth: true
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

// Función para verificar usuarios en tablas directamente
async function getUsersStatus() {
  try {
    console.log('\n===== ESTADO DE LOS USUARIOS EN TABLAS =====');
    
    // Obtener usuarios de public.users
    const { data: publicUsers, error: pubError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, created_at, updated_at')
      .in('email', userEmails);
    
    if (pubError) {
      console.error(`Error al consultar public.users: ${pubError.message}`);
      return;
    }
    
    console.log(`Usuarios encontrados en public.users: ${publicUsers.length}`);
    
    // Mostrar detalles
    publicUsers.forEach(user => {
      console.log(`\n>> Usuario: ${user.email} (${user.first_name} ${user.last_name})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status || 'No definido'}`);
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`);
    });
    
    return publicUsers;
  } catch (error) {
    console.error(`Error al verificar estado de usuarios: ${error.message}`);
  }
}

// Función principal
async function verifyAllLogins() {
  console.log('===== VERIFICANDO INICIO DE SESIÓN DE USUARIOS =====');
  
  // Primero verificar el estado actual de los usuarios en la base de datos
  const usersInDb = await getUsersStatus();
  
  if (!usersInDb || usersInDb.length === 0) {
    console.log('\n❌ No se encontraron usuarios en la base de datos. Verifica que los usuarios existan en public.users');
    console.log('Recuerda ejecutar primero el script SQL "verify-users-sql.sql" en el editor SQL de Supabase');
    return;
  }
  
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