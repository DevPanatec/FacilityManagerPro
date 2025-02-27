const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definimos los datos de la organización y del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const newUserData = {
  id: uuidv4(), // Generamos un UUID para el usuario
  email: 'nuevo.admin.directo@facilitymanagerpro.com',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'Directo',
  organization_id: organizationId,
  status: 'active',
  language: 'es',
  timezone: 'UTC',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
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

// Función para crear el usuario directamente en la tabla users
async function createAdminUserDirect() {
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
      .eq('email', newUserData.email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error al verificar si el usuario ya existe:', checkError);
      return;
    }
    
    if (existingUser) {
      console.error(`El usuario con email ${newUserData.email} ya existe.`);
      return;
    }
    
    console.log('Creando nuevo usuario administrador directamente...');
    
    // Insertamos el usuario directamente en la tabla users
    const { data, error } = await supabase
      .from('users')
      .insert(newUserData)
      .select();
    
    if (error) {
      console.error('Error al crear el usuario:', error);
      return;
    }
    
    console.log('Usuario administrador creado exitosamente');
    console.log(`- ID: ${data[0].id}`);
    console.log(`- Email: ${data[0].email}`);
    console.log(`- Rol: ${data[0].role}`);
    console.log(`- Organización: ${data[0].organization_id}`);
    
    // Nota importante sobre autenticación
    console.log('\nNOTA IMPORTANTE: Este usuario se ha creado directamente en la tabla users.');
    console.log('Para iniciar sesión, necesitarás crear credenciales de autenticación manualmente o usar otro método de acceso.');
    
  } catch (error) {
    console.error('Error inesperado al crear el usuario:', error);
  }
}

// Ejecutamos la función principal
createAdminUserDirect().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 