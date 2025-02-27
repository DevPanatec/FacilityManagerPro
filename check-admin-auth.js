const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con rol de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email del usuario administrador
const adminEmail = 'admin@facilitymanagerpro.com';

// Lista de contraseñas comunes para probar
const commonPasswords = [
  'admin',
  'admin123',
  'password',
  'password123',
  'facilitymanager',
  'facilitymanagerpro',
  '123456',
  'admin@facilitymanagerpro.com',
  'AdminPassword123!',
  'Admin123',
  'Facility123',
  'Manager123'
];

async function checkAdminAuth() {
  console.log(`===== VERIFICANDO AUTENTICACIÓN DEL USUARIO ADMIN =====`);
  console.log(`Email del admin: ${adminEmail}`);
  
  try {
    // 1. Intenta obtener información del usuario desde la API de auth
    console.log('\n1. Obteniendo información del usuario desde auth.admin.getUserById...');
    
    // Primero, obtener el ID de usuario de users
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', adminEmail)
      .single();
    
    if (dbError) {
      console.error('Error al buscar usuario en tabla users:', dbError);
      return;
    }
    
    if (!dbUser) {
      console.error(`No se encontró usuario con email ${adminEmail} en la tabla users`);
      return;
    }
    
    console.log(`Usuario encontrado en la tabla users con ID: ${dbUser.id}`);
    
    // Intentar obtener detalles del usuario en auth
    try {
      console.log('Intentando obtener detalles del usuario desde auth.admin.getUserById...');
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(dbUser.id);
      
      if (userError) {
        console.error('Error al obtener usuario desde auth:', userError);
      } else if (userData) {
        console.log('Usuario encontrado en sistema de autenticación:');
        console.log(userData);
      }
    } catch (e) {
      console.error('Error al usar auth.admin.getUserById:', e.message);
    }
    
    // 2. Probar inicio de sesión con contraseñas comunes
    console.log('\n2. Probando inicio de sesión con contraseñas comunes...');
    
    for (const password of commonPasswords) {
      console.log(`Probando contraseña: ${password}`);
      
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: password
        });
        
        if (signInError) {
          console.log(`  ❌ Contraseña incorrecta: ${password}`);
        } else {
          console.log(`  ✅ ¡CONTRASEÑA CORRECTA ENCONTRADA: ${password}!`);
          console.log('Detalles de la sesión:');
          console.log(signInData);
          
          // Terminar en cuanto se encuentre una contraseña correcta
          return;
        }
      } catch (e) {
        console.error(`Error al probar contraseña ${password}:`, e.message);
      }
    }
    
    // 3. Verificar configuración del usuario en auth
    console.log('\n3. Verificando configuración del usuario en auth...');
    
    try {
      const { data: adminUsers, error: adminUsersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 100
      });
      
      if (adminUsersError) {
        console.error('Error al listar usuarios auth:', adminUsersError);
      } else if (adminUsers && adminUsers.users) {
        const authUser = adminUsers.users.find(u => u.email === adminEmail);
        
        if (authUser) {
          console.log('Usuario encontrado en sistema de autenticación:');
          console.log({
            id: authUser.id,
            email: authUser.email,
            confirmed_at: authUser.confirmed_at,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at,
            last_sign_in_at: authUser.last_sign_in_at,
            user_metadata: authUser.user_metadata
          });
        } else {
          console.log(`No se encontró el usuario ${adminEmail} en el sistema de autenticación.`);
        }
      }
    } catch (e) {
      console.error('Error al listar usuarios auth:', e.message);
    }
    
    console.log('\n===== RECOMENDACIONES FINALES =====');
    console.log('1. Utiliza el enlace de recuperación generado anteriormente:');
    console.log('https://wldiefpqmfjxernvuywv.supabase.co/auth/v1/verify?token=26cfbc0b117d5d1f46f62c33ad5e3129e51ee6b12fbc34994a0e5d84&type=recovery&redirect_to=https://gestionhbc.com/');
    console.log('\n2. O utiliza este código OTP si es necesario: 152575');
    console.log('\n3. Una vez que tengas acceso, puedes establecer una nueva contraseña desde la interfaz de usuario.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
checkAdminAuth().catch(err => {
  console.error('Error fatal:', err);
}); 