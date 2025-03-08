const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase - IMPORTANTE: Usar variables de entorno en producción
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Solo para operaciones administrativas
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Para operaciones de cliente

// Cliente de Supabase con clave de servicio (solo para operaciones administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente de Supabase con clave anónima (para operaciones de cliente)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Email y contraseña para verificar
const userEmail = 'admin@example.com';
const userPassword = 'Password123!';

/**
 * FORMA CORRECTA: Verificar si un usuario existe consultando la tabla public.users
 * En lugar de consultar directamente auth.users (que no es accesible directamente)
 */
async function checkUserExists(email) {
  try {
    console.log(`Verificando si ${email} existe en public.users...`);
    
    const { data, error } = await supabaseAdmin
      .from('users') // Consultamos la tabla en el schema public, no en auth
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error(`Error al verificar usuario: ${error.message}`);
      return { exists: false, id: null };
    }
    
    return { exists: data !== null, id: data?.id };
  } catch (error) {
    console.error(`Error al verificar existencia: ${error.message}`);
    return { exists: false, id: null };
  }
}

/**
 * FORMA CORRECTA: Autenticar un usuario usando los métodos oficiales de la API de auth
 */
async function verifyUserLogin(email, password) {
  try {
    console.log(`Intentando login con: ${email}`);
    
    // Usar el método oficial de autenticación de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`Error al iniciar sesión: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`Login exitoso para: ${email}`);
    return { 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email
      } 
    };
  } catch (error) {
    console.error(`Error general: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * FORMA CORRECTA: Crear un nuevo usuario mediante la API de auth
 */
async function createUser(email, password, userData = {}) {
  try {
    console.log(`Creando usuario: ${email}`);
    
    // 1. Crear el usuario en auth mediante la API oficial
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar el email
      user_metadata: userData
    });
    
    if (error) {
      console.error(`Error al crear usuario: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`Usuario creado con ID: ${data.user.id}`);
    
    // El trigger que creamos insertará automáticamente el usuario en public.users
    // No necesitamos hacer nada más aquí
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error(`Error al crear usuario: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Función principal para demostrar el uso correcto
async function demoCorrectUsage() {
  console.log('===== DEMO DE USO CORRECTO DE SUPABASE AUTH =====');
  
  // 1. Verificar si un usuario existe
  const userCheck = await checkUserExists(userEmail);
  console.log(`Usuario existe: ${userCheck.exists ? 'SÍ' : 'NO'}`);
  
  // 2. Si el usuario no existe, crearlo
  if (!userCheck.exists) {
    console.log('El usuario no existe, creándolo...');
    const createResult = await createUser(userEmail, userPassword, {
      first_name: 'Admin',
      last_name: 'User'
    });
    
    if (!createResult.success) {
      console.error('No se pudo crear el usuario. Abortando demo.');
      return;
    }
    
    console.log('Usuario creado exitosamente.');
  }
  
  // 3. Verificar login
  const loginResult = await verifyUserLogin(userEmail, userPassword);
  console.log(`Resultado de login: ${loginResult.success ? 'EXITOSO' : 'FALLIDO'}`);
  
  if (loginResult.success) {
    console.log(`ID del usuario autenticado: ${loginResult.user.id}`);
  } else {
    console.log(`Error: ${loginResult.error}`);
  }
}

// Ejecutar la demo
demoCorrectUsage().catch(err => {
  console.error('Error fatal:', err);
}); 