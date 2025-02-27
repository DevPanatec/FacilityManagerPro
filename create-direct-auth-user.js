const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del nuevo usuario
const newUser = {
  email: "admin.nueva.cuenta@facilitymanagerpro.com",
  password: "SecurePassword123!",
  first_name: "Admin",
  last_name: "Nueva Cuenta",
  role: "admin",
  organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584" // HospitalesGlobales
};

async function createDirectAuthUser() {
  console.log(`===== CREANDO USUARIO DIRECTAMENTE EN AUTENTICACIÓN =====`);
  console.log(`Email: ${newUser.email}`);
  console.log(`Nombre: ${newUser.first_name} ${newUser.last_name}`);

  try {
    // 1. Verificar que el usuario no existe en auth
    console.log('\n1. Intentando iniciar sesión para verificar si el usuario ya existe...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: newUser.email,
      password: newUser.password
    });
    
    if (!signInError && signInData?.user) {
      console.log('¡ALERTA! El usuario ya existe en el sistema de autenticación.');
      console.log('ID del usuario existente:', signInData.user.id);
      return;
    }
    
    console.log('El usuario no existe en el sistema de autenticación.');
    
    // 2. Verificar que el usuario no existe en users
    console.log('\n2. Verificando si el usuario existe en la tabla users...');
    
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', newUser.email)
      .maybeSingle();
    
    if (existingError) {
      console.error('Error al verificar el usuario existente:', existingError);
      return;
    }
    
    if (existingUser) {
      console.log('¡ALERTA! El usuario ya existe en la tabla users.');
      console.log('ID del usuario existente:', existingUser.id);
      return;
    }
    
    console.log('El usuario no existe en la tabla users.');
    
    // 3. Crear usuario directamente en auth
    console.log('\n3. Creando usuario en el sistema de autenticación...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      email_confirm: true,
      user_metadata: {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        organization_id: newUser.organization_id
      }
    });
    
    if (authError) {
      console.error('Error al crear el usuario en el sistema de autenticación:', authError);
      return;
    }
    
    if (!authData || !authData.user) {
      console.error('No se recibió información del usuario creado.');
      return;
    }
    
    console.log('Usuario creado exitosamente en el sistema de autenticación:');
    console.log('ID: ', authData.user.id);
    console.log('Email: ', authData.user.email);
    console.log('Confirmed: ', authData.user.email_confirmed_at ? 'Yes' : 'No');
    
    // 4. Buscar IDs en users para reutilizar
    console.log('\n4. Buscando IDs disponibles en la tabla users...');
    
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (inactiveError) {
      console.error('Error al buscar usuarios inactivos:', inactiveError);
      return;
    }
    
    if (!inactiveUsers || inactiveUsers.length === 0) {
      console.error('No se encontraron usuarios para reutilizar ID.');
      return;
    }
    
    let idToUse = null;
    
    for (const user of inactiveUsers) {
      // Verificar si este usuario tiene asignaciones
      const { count, error: countError } = await supabase
        .from('assignments')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (!countError && (!count || count === 0)) {
        console.log(`Usuario candidato para reutilizar ID: ${user.email} (${user.id})`);
        idToUse = user.id;
        break;
      }
    }
    
    if (!idToUse) {
      console.error('No se encontró un ID adecuado para reutilizar.');
      return;
    }
    
    // 5. Actualizar el usuario en la tabla users con la misma ID que en auth
    console.log(`\n5. Actualizando usuario en la tabla users con ID: ${idToUse}...`);
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        organization_id: newUser.organization_id,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', idToUse)
      .select();
    
    if (updateError) {
      console.error('Error al actualizar el usuario en la tabla users:', updateError);
      return;
    }
    
    console.log('¡ÉXITO! Usuario actualizado en la tabla users:');
    console.log(updatedUser);
    
    // 6. Verificación final
    console.log('\n6. Verificando la creación del usuario...');
    
    // Intentar iniciar sesión con las credenciales
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: newUser.email,
      password: newUser.password
    });
    
    if (loginError) {
      console.error('Error al verificar inicio de sesión:', loginError);
    } else {
      console.log('¡VERIFICACIÓN EXITOSA! Se puede iniciar sesión con las credenciales proporcionadas.');
      console.log('\n==== INSTRUCCIONES PARA USAR ESTE USUARIO ====');
      console.log('Email: ' + newUser.email);
      console.log('Contraseña: ' + newUser.password);
      console.log('\nUsa estas credenciales para iniciar sesión en https://gestionhbc.com/auth/login');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
createDirectAuthUser().catch(err => {
  console.error('Error fatal:', err);
}); 