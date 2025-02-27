const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definimos los datos de la organización y del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userEmail = 'nuevo.admin.auth@facilitymanagerpro.com';
const userPassword = 'Abc123456!'; // Contraseña que cumple con requisitos mínimos
const userData = {
  email: userEmail,
  password: userPassword,
  role: 'admin',
  first_name: 'Admin',
  last_name: 'Auth',
  organization_id: organizationId,
  status: 'active',
  language: 'es',
  timezone: 'UTC'
};

// Función para verificar si existe la organización
async function checkOrganization() {
  try {
    console.log(`Verificando organización con ID: ${organizationId}`);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    
    if (error) {
      console.error('Error al verificar la organización:', error);
      return false;
    }
    
    if (!data) {
      console.error('La organización con el ID especificado no existe');
      return false;
    }
    
    console.log('Organización encontrada:');
    console.log(`- Nombre: ${data.name}`);
    console.log(`- Estado: ${data.status}`);
    
    return true;
  } catch (error) {
    console.error('Error inesperado al verificar la organización:', error);
    return false;
  }
}

// Función para crear el usuario admin utilizando el método de autenticación
async function createAdminUser() {
  try {
    // Verificamos primero que la organización exista
    const organizationExists = await checkOrganization();
    if (!organizationExists) {
      return;
    }

    // Verificamos si ya existe un usuario con ese email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userData.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar si el usuario ya existe:', checkError);
      return;
    }

    if (existingUser) {
      console.error(`El usuario con email ${userData.email} ya existe.`);
      return;
    }

    console.log('Creando nuevo usuario administrador con autenticación...');

    // Crear el usuario utilizando el método de autenticación
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          organization_id: userData.organization_id,
          status: userData.status,
          language: userData.language,
          timezone: userData.timezone
        }
      }
    });

    if (authError) {
      console.error('Error al crear la autenticación para el usuario:', authError);
      return;
    }

    console.log('Usuario creado exitosamente con autenticación:');
    console.log(`- ID: ${authData.user.id}`);
    console.log(`- Email: ${authData.user.email}`);
    console.log(`- Role: ${authData.user.user_metadata.role}`);
    console.log(`- Organización: ${authData.user.user_metadata.organization_id}`);

    // Verificar si el usuario también se creó en la tabla users
    console.log('\nVerificando creación en la tabla users...');
    setTimeout(async () => {
      const { data: createdUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();

      if (userError) {
        console.error('Error al verificar la creación en la tabla users:', userError);
      } else if (createdUser) {
        console.log('Usuario también creado en la tabla users:');
        console.log(`- ID: ${createdUser.id}`);
        console.log(`- Email: ${createdUser.email}`);
        console.log(`- Role: ${createdUser.role}`);
        console.log(`- Organización: ${createdUser.organization_id}`);
      } else {
        console.log('El usuario NO se encuentra en la tabla users todavía.');
        console.log('Es posible que sea necesario ejecutar un trigger o función adicional.');
      }
    }, 2000); // Esperamos 2 segundos para dar tiempo a que se propague la creación

  } catch (error) {
    console.error('Error inesperado al crear el usuario:', error);
  }
}

// Ejecutamos la función principal
createAdminUser().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 