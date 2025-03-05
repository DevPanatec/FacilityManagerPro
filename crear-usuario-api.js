// Script para crear un usuario utilizando la API oficial de Supabase
// Guarda este archivo como crear-usuario-api.js y ejecútalo con Node.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con las credenciales reales
const SUPABASE_URL = 'https://wldiefpqmfjxernvuywv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

async function crearUsuarioAdmin() {
  try {
    // Crear cliente de Supabase con la clave de servicio (tiene permisos admin)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Datos del usuario a crear
    const email = 'admin_api@hospitalintegrado.com';
    const password = 'ApiTest123!';
    
    console.log(`Intentando crear usuario: ${email}`);
    
    // 1. Crear el usuario en auth.users usando la API de Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Marca el email como confirmado
      user_metadata: {
        first_name: 'Admin',
        last_name: 'API',
      },
      app_metadata: {
        role: 'admin',
        provider: 'email',
        providers: ['email']
      }
    });
    
    if (authError) {
      console.error('Error al crear usuario en auth:', authError);
      return;
    }
    
    console.log('Usuario creado exitosamente en auth:', authUser);
    
    // 2. Insertar el usuario en public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id,
          email: email,
          first_name: 'Admin',
          last_name: 'API',
          role: 'admin',
          organization_id: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584' // HospitalesGlobales
        }
      ]);
    
    if (publicError) {
      console.error('Error al crear usuario en public.users:', publicError);
      return;
    }
    
    console.log('Usuario insertado exitosamente en public.users');
    console.log('Proceso completo. Usuario creado correctamente.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
crearUsuarioAdmin(); 