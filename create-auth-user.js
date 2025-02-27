const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con rol de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del usuario que ya existe en la tabla users pero no en auth
const userData = {
  email: 'admin.workaround@facilitymanagerpro.com',
  password: 'SecurePass123!',
  email_confirm: true
};

// ID del usuario en la tabla users
const existingUserId = '3c162c5e-01af-4578-a70a-aa595707033b';

async function createAuthUser() {
  console.log('===== CREANDO USUARIO EN EL SISTEMA DE AUTENTICACIÓN =====');
  console.log(`Email: ${userData.email}`);
  console.log(`ID existente en users: ${existingUserId}`);
  
  try {
    // Método 1: Intentar crear un usuario usando el API de autenticación administrativa
    console.log('\n--- MÉTODO 1: USANDO ADMIN AUTH API ---');
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { existingId: existingUserId }
    });

    if (adminAuthError) {
      console.error('Error al crear usuario usando Admin Auth API:', adminAuthError);
    } else {
      console.log('Usuario creado exitosamente con Admin Auth API:');
      console.log(adminAuthData);
      return;
    }

    // Método 2: Intentar crear usuario directamente con signUp
    console.log('\n--- MÉTODO 2: USANDO SIGNUP ---');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { existingId: existingUserId }
      }
    });

    if (signUpError) {
      console.error('Error al crear usuario usando SignUp:', signUpError);
    } else {
      console.log('Usuario creado exitosamente con SignUp:');
      console.log(signUpData);
      return;
    }

    // Método 3: Intento alternativo con createUser
    console.log('\n--- MÉTODO 3: USANDO CREATE USER ---');
    
    // Nota: Esto puede no funcionar dependiendo de las restricciones de Supabase
    try {
      const { data: createData, error: createError } = await supabase.auth.api.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { existingId: existingUserId }
      });

      if (createError) {
        console.error('Error al crear usuario usando CreateUser API:', createError);
      } else {
        console.log('Usuario creado exitosamente con CreateUser API:');
        console.log(createData);
        return;
      }
    } catch (e) {
      console.error('Este método no está disponible en la versión actual de Supabase:', e.message);
    }

    console.log('\n===== INSTRUCCIONES MANUALES =====');
    console.log('Si los métodos automáticos fallaron, sigue estos pasos:');
    console.log('1. Ve a la consola de Supabase: https://wldiefpqmfjxernvuywv.supabase.co/dashboard/project/wldiefpqmfjxernvuywv/auth/users');
    console.log('2. Haz clic en "Add User"');
    console.log('3. Ingresa el email: admin.workaround@facilitymanagerpro.com');
    console.log('4. Ingresa la contraseña: SecurePass123!');
    console.log('5. Asegúrate de marcar "Auto confirm user" si está disponible');
    console.log('6. Haz clic en "Create User"');
    console.log('7. Una vez creado, deberías poder ver al usuario en la lista de autenticación');

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
createAuthUser().catch(err => {
  console.error('Error fatal:', err);
}); 