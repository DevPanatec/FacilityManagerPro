// Script para probar inicio de sesión con usuarios existentes
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://wldiefpqmfjxernvuywv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.AusTn9-KHn1HWrCuFcXSdldDH9pMnG5RNpcvqNUGHQE'; // Usa la anon key para login

// Lista de usuarios a probar (de los que vimos en la interfaz)
const usuariosParaProbar = [
  'superadmin@facilitymanagerpro.com',
  'admin@hospitalintegrado.com',
  'admin1@hospitalintegrado.com',
  'admin2@hospitalintegrado.com',
  'admin3@hospitalintegrado.com',
  'admin4@hospitalintegrado.com',
  'admin5@hospitalintegrado.com',
  'admin_prueba@hospitalintegrado.com',
  'admin.nuevo@example.com',
  'alejandro.echevers@hospitalesglobales.com'
];

// Lista de contraseñas comunes a probar
const contraseñasComunes = [
  'password',
  'admin123',
  'Password123',
  'Password123!',
  'ContraseñaSegura123!',
  'Prueba123!',
  'NuevaContraseña123!',
  '123456',
  'admin',
  'facilitymanager',
  'hospital123',
  'hospitalintegrado'
];

async function probarLogin(email, password) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { éxito: false, mensaje: error.message };
    }
    
    return { 
      éxito: true,
      usuario: data.user.email,
      token: data.session.access_token
    };
    
  } catch (error) {
    return { éxito: false, mensaje: `Error inesperado: ${error.message}` };
  }
}

async function probarTodosLosUsuarios() {
  console.log('Comenzando pruebas de inicio de sesión...');
  console.log('--------------------------------------');
  
  for (const email of usuariosParaProbar) {
    console.log(`\nProbando usuario: ${email}`);
    
    for (const password of contraseñasComunes) {
      process.stdout.write(`  Probando contraseña: ${password.substring(0, 3)}${'*'.repeat(password.length - 3)} ... `);
      
      const resultado = await probarLogin(email, password);
      
      if (resultado.éxito) {
        console.log('✅ ÉXITO! Inicio de sesión correcto');
        console.log(`  Usuario: ${resultado.usuario}`);
        console.log(`  Contraseña: ${password}`);
        console.log('--------------------------------------');
        // Guardamos para referencia futura (opcional)
        console.log(`  Token: ${resultado.token.substring(0, 15)}...`);
        break; // Pasamos al siguiente usuario
      } else {
        console.log('❌ Fallido');
      }
    }
  }
  
  console.log('\nPruebas completadas');
}

// Ejecutar todas las pruebas
probarTodosLosUsuarios(); 