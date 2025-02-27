// Script para crear un usuario asignado a una organización específica
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (asegúrate de que estas variables estén en tu .env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Crea el cliente de Supabase con la clave de servicio (permite operaciones admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Datos del usuario a crear
const userData = {
  email: 'usuario.nuevo@empresa.com',  // Cambia esto por el email que desees
  password: 'Password123!',            // Contraseña segura
  firstName: 'Usuario',                // Nombre del usuario
  lastName: 'Nuevo',                   // Apellido del usuario
  role: 'usuario',                     // Rol: 'superadmin', 'admin', 'enterprise', 'usuario'
  organizationId: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'  // ID de la organización proporcionada
};

async function createUser() {
  try {
    console.log(`Creando usuario: ${userData.email}`);
    
    // Crear el usuario en auth.users con metadatos
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,  // Confirma el email automáticamente
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        organization_id: userData.organizationId
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en auth: ${authError.message}`);
    }

    console.log(`✅ Usuario creado con éxito con ID: ${authUser.user.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Nombre: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`ID de hospital/organización: ${userData.organizationId}`);
    
    // También podemos verificar que el usuario se haya creado correctamente en la tabla users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    if (profileError) {
      console.warn(`⚠️ No se pudo verificar el perfil del usuario: ${profileError.message}`);
    } else {
      console.log(`✅ Perfil de usuario creado en la tabla 'users'`);
      console.log(userProfile);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Ejecutar la función
createUser(); 