const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email del usuario para el que queremos generar el enlace de recuperación
const userEmail = 'nuevo.admin@facilitymanagerpro.com';

async function generateRecoveryLink() {
  console.log(`===== GENERANDO ENLACE DE RECUPERACIÓN DE CONTRASEÑA =====`);
  console.log(`Para el usuario: ${userEmail}`);
  
  try {
    // 1. Verificar que el usuario existe
    console.log('\n1. Verificando que el usuario existe...');
    
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, organization_id')
      .eq('email', userEmail)
      .single();
    
    if (existingError) {
      console.error('Error al verificar el usuario:', existingError);
      return;
    }
    
    if (!existingUser) {
      console.error(`No se encontró ningún usuario con el email ${userEmail}`);
      return;
    }
    
    console.log('Usuario encontrado:');
    console.log(`ID: ${existingUser.id}`);
    console.log(`Nombre: ${existingUser.first_name} ${existingUser.last_name}`);
    console.log(`Rol: ${existingUser.role}`);
    console.log(`Organización: ${existingUser.organization_id}`);
    
    // 2. Generar enlace de recuperación
    console.log('\n2. Generando enlace de recuperación...');
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: 'https://gestionhbc.com'
      }
    });
    
    if (linkError) {
      console.error('Error al generar enlace de recuperación:', linkError);
      return;
    }
    
    if (!linkData) {
      console.error('No se pudo generar el enlace de recuperación (respuesta vacía)');
      return;
    }
    
    // 3. Mostrar información del enlace
    console.log('\n==== INFORMACIÓN DEL ENLACE DE RECUPERACIÓN ====');
    console.log('Enlace de recuperación:');
    console.log(linkData.properties.action_link);
    
    console.log('\nCódigo OTP (si es necesario):');
    console.log(linkData.properties.email_otp);
    
    console.log('\n==== INSTRUCCIONES ====');
    console.log('1. Abre el enlace de recuperación en tu navegador');
    console.log('2. Establece una nueva contraseña para el usuario');
    console.log('3. Una vez cambiada la contraseña, podrás iniciar sesión con:');
    console.log(`   - Email: ${userEmail}`);
    console.log('   - Y la contraseña que hayas establecido');
    
    // 4. También intentaremos iniciar sesión directamente
    console.log('\n4. Intentando algunas contraseñas comunes por si acaso...');
    
    const commonPasswords = [
      'admin',
      'admin123',
      'password',
      'password123',
      userEmail,
      'facilitymanager',
      '123456',
      `${existingUser.first_name.toLowerCase()}123`
    ];
    
    for (const password of commonPasswords) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });
      
      if (!signInError && signInData) {
        console.log(`\n¡ÉXITO! Contraseña encontrada: ${password}`);
        console.log('Puedes iniciar sesión con estas credenciales.');
        return;
      }
    }
    
    console.log('\nNo se encontró ninguna contraseña común. Utiliza el enlace de recuperación para establecer una nueva contraseña.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
generateRecoveryLink().catch(err => {
  console.error('Error fatal:', err);
}); 