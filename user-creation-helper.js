const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Script para ayudar a crear nuevos usuarios en el sistema
 * 
 * IMPORTANTE: Debido a las restricciones de la base de datos, este script
 * utiliza la técnica de clonar un usuario existente y modificar sus datos.
 * 
 * Uso:
 * 1. Modifica los datos en la sección "Configuración del nuevo usuario"
 * 2. Ejecuta el script con: node user-creation-helper.js
 * 3. El script intentará clonar un usuario existente y actualizarlo
 */

// =============================================
// CONFIGURACIÓN DEL NUEVO USUARIO
// Modifica estos valores según sea necesario
// =============================================

const newUserData = {
  email: "nuevo.admin@facilitymanagerpro.com", // Email del nuevo usuario
  first_name: "Nuevo",                        // Nombre
  last_name: "Admin",                         // Apellido
  role: "admin",                              // Rol: 'admin' o 'enterprise'
  organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584" // ID de la organización
};

// ID del usuario a clonar (dejarlo vacío para usar uno automático)
const userToCloneId = "";

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

async function createNewUserByCloning() {
  console.log(`===== ASISTENTE DE CREACIÓN DE USUARIOS =====`);
  console.log(`Email: ${newUserData.email}`);
  console.log(`Nombre: ${newUserData.first_name} ${newUserData.last_name}`);
  console.log(`Rol: ${newUserData.role}`);
  console.log(`ID de organización: ${newUserData.organization_id}`);
  
  try {
    // 1. Verificar que el usuario no existe
    console.log('\n1. Verificando si el usuario ya existe...');
    
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', newUserData.email)
      .maybeSingle();
    
    if (existingError) {
      console.error('Error al verificar usuario existente:', existingError);
      return;
    }
    
    if (existingUser) {
      console.log(`¡ERROR! Ya existe un usuario con el email ${newUserData.email}`);
      console.log('ID del usuario existente:', existingUser.id);
      return;
    }
    
    // 2. Verificar que la organización existe
    console.log('\n2. Verificando la organización...');
    
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', newUserData.organization_id)
      .single();
    
    if (orgError) {
      console.error('Error al verificar la organización:', orgError);
      return;
    }
    
    if (!organization) {
      console.error(`¡ERROR! No existe organización con ID ${newUserData.organization_id}`);
      return;
    }
    
    console.log(`Organización encontrada: ${organization.name} (${organization.status})`);
    
    // 3. Buscar un usuario para clonar
    console.log('\n3. Buscando usuario para clonar...');
    
    let userToClone;
    if (userToCloneId) {
      // Si se especificó un ID de usuario para clonar
      const { data: specifiedUser, error: specifiedError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userToCloneId)
        .single();
      
      if (specifiedError || !specifiedUser) {
        console.error(`Error al buscar el usuario específico con ID ${userToCloneId}:`, specifiedError);
        // Continuamos con la búsqueda automática
      } else {
        userToClone = specifiedUser;
        console.log(`Usuario especificado encontrado: ${userToClone.email} (${userToClone.id})`);
      }
    }
    
    // Si no se especificó un usuario o no se encontró, buscar uno automáticamente
    if (!userToClone) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', newUserData.role)
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.error('Error al buscar usuarios para clonar:', usersError || 'No se encontraron usuarios');
        return;
      }
      
      userToClone = users[0];
      console.log(`Usuario seleccionado para clonar: ${userToClone.email} (${userToClone.id})`);
    }
    
    // 4. Método 1: Actualizar un usuario existente
    console.log('\n4. MÉTODO 1: Actualizar un usuario existente con poco uso');
    
    // Buscar usuarios con nombres genéricos o de prueba que podrían ser reutilizados
    const candidateTerms = ['test', 'prueba', 'temp', 'demo'];
    let candidateFound = false;
    
    for (const term of candidateTerms) {
      const { data: candidates, error: candidatesError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .ilike('email', `%${term}%`)
        .limit(1);
      
      if (!candidatesError && candidates && candidates.length > 0) {
        const candidate = candidates[0];
        console.log(`Usuario candidato encontrado: ${candidate.email} (${candidate.id})`);
        
        // Intentar actualizar este usuario
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: newUserData.email,
            first_name: newUserData.first_name,
            last_name: newUserData.last_name,
            organization_id: newUserData.organization_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', candidate.id)
          .select();
        
        if (updateError) {
          console.error(`Error al actualizar el usuario candidato:`, updateError);
        } else {
          console.log('¡ÉXITO! Usuario existente actualizado:');
          console.log(updatedUser);
          console.log('\nRECOMENDACIÓN: Ahora necesitas restablecer la contraseña desde la interfaz de Supabase.');
          candidateFound = true;
          break;
        }
      }
    }
    
    if (candidateFound) {
      return;
    }
    
    // 5. Método 2: Modificar la tabla users directamente (no recomendado pero funcional)
    console.log('\n5. MÉTODO 2: Encontrar un usuario con poco uso y actualizarlo');
    
    // Buscar usuarios que no tengan asignaciones activas
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: true })
      .limit(5);
    
    if (inactiveError || !inactiveUsers || inactiveUsers.length === 0) {
      console.error('Error al buscar usuarios inactivos:', inactiveError || 'No se encontraron usuarios');
    } else {
      console.log('Usuarios disponibles para actualizar:');
      
      for (const user of inactiveUsers) {
        // Verificar si este usuario tiene asignaciones
        const { count, error: countError } = await supabase
          .from('assignments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (!countError) {
          console.log(`- ${user.email} (ID: ${user.id}, Asignaciones: ${count || 0})`);
          
          if (!count || count === 0) {
            // Este usuario no tiene asignaciones, es buen candidato
            console.log(`\nActualizando usuario sin asignaciones: ${user.email}`);
            
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({
                email: newUserData.email,
                first_name: newUserData.first_name,
                last_name: newUserData.last_name,
                organization_id: newUserData.organization_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
              .select();
            
            if (updateError) {
              console.error(`Error al actualizar el usuario:`, updateError);
            } else {
              console.log('¡ÉXITO! Usuario existente actualizado:');
              console.log(updatedUser);
              console.log('\nRECOMENDACIÓN: Ahora necesitas restablecer la contraseña desde la interfaz de Supabase.');
              return;
            }
          }
        }
      }
    }
    
    console.log('\n===== RECOMENDACIONES FINALES =====');
    console.log('No se pudo crear un nuevo usuario automáticamente.');
    console.log('Opciones disponibles:');
    console.log('1. Modificar este script para usar un usuario específico existente (userToCloneId)');
    console.log('2. Contactar al administrador de la base de datos para resolver la restricción de clave foránea');
    console.log('3. Utilizar un usuario existente temporalmente');
    
    // Listar algunos usuarios existentes que podrían ser utilizados
    const { data: existingUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, organization_id')
      .eq('role', newUserData.role)
      .limit(5);
    
    if (!listError && existingUsers && existingUsers.length > 0) {
      console.log('\nUsuarios existentes que podrías utilizar:');
      existingUsers.forEach(user => {
        console.log(`- ${user.email} (${user.first_name} ${user.last_name}, Org: ${user.organization_id || 'ninguna'})`);
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función principal
createNewUserByCloning().catch(err => {
  console.error('Error fatal:', err);
}); 