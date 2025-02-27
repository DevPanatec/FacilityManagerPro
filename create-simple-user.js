// Script simple para crear un usuario sin metadatos
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar credenciales
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son necesarias');
  process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generar email único para evitar conflictos
const uniqueEmail = `user.${Date.now()}@example.com`;

async function createSimpleUser() {
  console.log(`Intentando crear usuario simple: ${uniqueEmail}`);
  
  try {
    // Crear usuario sin metadatos
    const { data, error } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      password: 'Password123!',
      email_confirm: true
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
      if (error.details) console.error('Detalles:', error.details);
      return;
    }
    
    console.log('✅ Usuario creado con éxito:', data.user.id);
    console.log('Email:', uniqueEmail);
    
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
  }
}

// Ejecutar
createSimpleUser(); 