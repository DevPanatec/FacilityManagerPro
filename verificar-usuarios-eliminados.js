const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Verificar ambas tablas
async function checkUsersInBothTables() {
  console.log('===== VERIFICACIÓN DE USUARIOS ELIMINADOS =====');
  
  console.log('\n>> Verificando usuarios en public.users:');
  
  // Verificar en public.users
  const { data: publicUsers, error: pubError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, status')
    .in('email', userEmails);
  
  if (pubError) {
    console.error(`Error al consultar public.users: ${pubError.message}`);
  } else {
    console.log(`Usuarios encontrados en public.users: ${publicUsers?.length || 0}/${userEmails.length}`);
    
    if (publicUsers && publicUsers.length > 0) {
      publicUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name}): ${user.status || 'Sin estado'}`);
      });
    }
  }
  
  // Intentar verificar en auth.users (indirectamente)
  console.log('\n>> Verificando usuarios en auth.users (vía signIn attempt):');
  
  for (const email of userEmails) {
    try {
      // Crear un cliente de Supabase específico para este intento
      const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.gPrqf-VBZAaVvBJZNnrITF1z17ik0pqt91pRGrtBWyo');
      
      // Intentar inicio de sesión (solo para verificar si existe en auth)
      const { error } = await anonClient.auth.signInWithPassword({
        email,
        password: 'Password123!' // contraseña predeterminada
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          console.log(`  - ${email}: Existe en auth.users pero credenciales incorrectas`);
        } else if (error.message.includes('user not found')) {
          console.log(`  - ${email}: No existe en auth.users`);
        } else {
          console.log(`  - ${email}: Error - ${error.message}`);
        }
      } else {
        console.log(`  - ${email}: ¡Existe en auth.users y se pudo iniciar sesión!`);
        // Cerrar sesión
        await anonClient.auth.signOut();
      }
    } catch (error) {
      console.log(`  - ${email}: Error general - ${error.message}`);
    }
    
    // Esperar un momento entre intentos
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n===== CONCLUSIÓN =====');
  console.log('Si no hay usuarios en public.users pero los hay en auth.users, tenemos un problema de sincronización.');
  console.log('Si no hay usuarios en ninguna de las dos tablas, necesitamos restaurarlos desde el CSV original.');
}

// Verificar todos los usuarios en la base de datos
async function checkAllUsersInDatabase() {
  console.log('\n>> Verificando TODOS los usuarios en public.users:');
  
  // Verificar todos los usuarios en public.users
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, status');
  
  if (allError) {
    console.error(`Error al consultar todos los usuarios: ${allError.message}`);
  } else {
    console.log(`Total de usuarios en la base de datos: ${allUsers?.length || 0}`);
    
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name}): ${user.status || 'Sin estado'}`);
      });
    }
  }
}

// Iniciar verificación
async function main() {
  await checkUsersInBothTables();
  await checkAllUsersInDatabase();
}

main().catch(err => {
  console.error('Error fatal:', err);
}); 