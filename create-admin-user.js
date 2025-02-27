// Script para crear un usuario administrador usando SQL directo
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definimos los datos de la organización y del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const newUserData = {
  email: 'nuevo.admin@facilitymanagerpro.com',
  password: 'Admin123$ecure!',  // Esta contraseña se cambiará en el primer inicio de sesión
  role: 'admin',
  first_name: 'Nuevo',
  last_name: 'Administrador',
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

// Función para crear el usuario
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
    
    console.log('Creando nuevo usuario administrador...');
    
    // Creamos el usuario con autenticación
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: newUserData.email,
      password: newUserData.password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error al crear autenticación para el usuario:', authError);
      return;
    }
    
    console.log('Usuario creado con éxito en el sistema de autenticación');
    
    // Ahora actualizamos la tabla users con los datos adicionales
    const userId = authData.user.id;
    
    const { data, error } = await supabase
      .from('users')
      .update({
        role: newUserData.role,
        first_name: newUserData.first_name,
        last_name: newUserData.last_name,
        organization_id: organizationId,
        status: newUserData.status,
        language: newUserData.language,
        timezone: newUserData.timezone
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error al actualizar datos del usuario:', error);
      return;
    }
    
    console.log('Usuario administrador creado exitosamente');
    console.log(`- ID: ${userId}`);
    console.log(`- Email: ${newUserData.email}`);
    console.log(`- Rol: ${newUserData.role}`);
    console.log(`- Organización: ${organizationId}`);
    
  } catch (error) {
    console.error('Error inesperado al crear el usuario:', error);
  }
}

// Ejecutamos la función principal
createAdminUser().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 