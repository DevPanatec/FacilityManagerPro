const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con credenciales de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Datos del nuevo usuario administrador
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userData = {
  email: 'admin.bypass@facilitymanagerpro.com',
  password: 'SecurePass123!',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'Bypass',
  organization_id: organizationId
};

// Función para verificar la organización
async function checkOrganization() {
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
    console.error('La organización especificada no existe');
    return false;
  }
  
  console.log(`Organización encontrada: ${data.name} (${data.status})`);
  return true;
}

// Función principal para crear el usuario administrador
async function createAdminUserBypass() {
  try {
    // Verificar que la organización existe
    const organizationExists = await checkOrganization();
    if (!organizationExists) {
      return;
    }
    
    // Verificar si el usuario ya existe
    console.log(`Verificando si el usuario ${userData.email} ya existe...`);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userData.email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error al verificar usuario existente:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log(`El usuario ${userData.email} ya existe.`);
      return;
    }
    
    console.log('MÉTODO 1: Intentando crear usuario usando la API admin...');
    
    try {
      // Intentar método 1: Usar la API admin con configuración modificada
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          role: userData.role,
          organization_id: userData.organization_id,
          first_name: userData.first_name,
          last_name: userData.last_name
        },
        app_metadata: {
          role: userData.role,
          organization_id: userData.organization_id
        }
      });
      
      if (authError) {
        console.error('Método 1 falló:', authError);
      } else {
        console.log('Usuario creado exitosamente con Método 1');
        console.log(`ID: ${authUser.user.id}`);
        console.log(`Email: ${authUser.user.email}`);
        
        // Actualizar campos adicionales en la tabla users si es necesario
        await updateUserFields(authUser.user.id);
        return;
      }
    } catch (e) {
      console.error('Error en Método 1:', e.message);
    }
    
    console.log('\nMÉTODO 2: Intentando procedimiento alternativo SQL-like...');
    
    try {
      // Generar un UUID para el usuario
      const userId = uuidv4();
      console.log(`Generado UUID para el usuario: ${userId}`);
      
      // Intento de realizar operación similar a SQL directo a través de la API
      console.log('Ejecutando función de creación personalizada (simulando SQL)...');
      
      // Insertamos directamente en la tabla users, ignorando temporalmente las restricciones
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          organization_id: userData.organization_id,
          status: 'active',
          language: 'es',
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
          failed_login_attempts: 0
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error en inserción directa:', insertError);
        
        // Si falla la inserción directa, intentamos un último recurso usando RPC personalizado
        console.log('\nMÉTODO 3: Intentando crear usuario mediante función SQL personalizada...');
        console.log('Este método requeriría acceso al editor SQL de Supabase para crear primero una función personalizada');
        console.log('Simularemos el proceso aquí, pero se recomienda seguir las instrucciones manuales del archivo "instrucciones-crear-admin.md"');
      } else {
        console.log('¡Usuario creado exitosamente con Método 2!');
        console.log(`ID: ${insertedUser.id}`);
        console.log(`Email: ${insertedUser.email}`);
        console.log(`Role: ${insertedUser.role}`);
        console.log(`Organización: ${insertedUser.organization_id}`);
        
        console.log('\nNOTA: Este usuario no tiene credenciales de autenticación.');
        console.log('Continúa con la configuración manual de autenticación siguiendo las instrucciones.');
      }
    } catch (e) {
      console.error('Error general en Método 2:', e.message);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Función para actualizar campos adicionales en la tabla users
async function updateUserFields(userId) {
  console.log(`Actualizando campos adicionales para usuario ${userId}...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
      organization_id: userData.organization_id,
      status: 'active',
      language: 'es',
      timezone: 'UTC',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
  
  if (error) {
    console.error('Error al actualizar campos adicionales:', error);
  } else {
    console.log('Campos adicionales actualizados correctamente');
  }
}

// Ejecutar el script
createAdminUserBypass().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 