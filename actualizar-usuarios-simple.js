const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de correos de usuarios a actualizar
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

// Función para actualizar un usuario en la tabla users
async function updateUser(email) {
  try {
    console.log(`Actualizando usuario: ${email}`);
    
    // Primero, obtener el ID del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, status')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      console.error(`Error al obtener usuario ${email}: ${userError?.message || 'No encontrado'}`);
      return {
        email,
        success: false,
        error: userError?.message || 'Usuario no encontrado'
      };
    }
    
    console.log(`  ID: ${user.id}`);
    console.log(`  Nombre: ${user.first_name} ${user.last_name}`);
    console.log(`  Rol: ${user.role}`);
    console.log(`  Estado actual: ${user.status || 'No definido'}`);
    
    // Actualizar el usuario
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      console.error(`Error al actualizar usuario ${email}: ${error.message}`);
      return {
        email,
        id: user.id,
        success: false,
        error: error.message
      };
    }
    
    console.log(`  ✅ Usuario ${email} actualizado exitosamente como activo`);
    
    // Intentar actualizar metadatos adicionales si es posible
    try {
      const { data: metaData, error: metaError } = await supabase
        .from('users')
        .update({
          verified: true,
          completed_profile: true,
          email_verified: true
        })
        .eq('id', user.id);
      
      if (metaError) {
        console.log(`  ℹ️ No se pudieron actualizar metadatos adicionales: ${metaError.message}`);
      } else {
        console.log(`  ✅ Metadatos adicionales actualizados`);
      }
    } catch (metaError) {
      console.log(`  ℹ️ Error al actualizar metadatos: ${metaError.message}`);
    }
    
    return {
      email,
      id: user.id,
      success: true
    };
  } catch (error) {
    console.error(`Error general al actualizar usuario ${email}: ${error.message}`);
    return {
      email,
      success: false,
      error: error.message
    };
  }
}

// Función principal
async function updateAllUsers() {
  console.log('===== ACTUALIZANDO TODOS LOS USUARIOS =====');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const email of userEmails) {
    console.log(`\n[${userEmails.indexOf(email) + 1}/${userEmails.length}] Procesando: ${email}`);
    
    // Actualizar usuario
    const result = await updateUser(email);
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
  }
  
  // Mostrar resumen
  console.log('\n===== RESUMEN =====');
  console.log(`Total procesados: ${userEmails.length}`);
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Fallidos: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nUsuarios con problemas:');
    results.failed.forEach(user => {
      console.log(`- ${user.email}: ${user.error}`);
    });
  }
  
  // Guardar resultados
  fs.writeFileSync('user-update-results.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en user-update-results.json');
  
  // Mostrar mensaje final
  console.log('\nNOTA IMPORTANTE:');
  console.log('Este script solo actualiza la tabla "public.users". Para completar la verificación');
  console.log('aún es necesario ejecutar el script SQL "verify-users-sql.sql" en el SQL Editor de Supabase');
  console.log('para sincronizar los usuarios con la tabla "auth.users" y permitir el inicio de sesión.');
  
  return results;
}

// Ejecutar
updateAllUsers().catch(err => {
  console.error('Error fatal:', err);
}); 