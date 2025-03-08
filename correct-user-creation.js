const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase - Usar variables de entorno en producción
const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu-service-role-key';

// Cliente de Supabase con clave de servicio (solo para operaciones administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * FORMA CORRECTA: Crear un usuario administrador
 * 
 * Este enfoque es correcto porque:
 * 1. Usa la API oficial de Admin para crear el usuario en auth
 * 2. Confía en el trigger para crear automáticamente el registro en public.users
 * 3. Actualiza datos adicionales en public.users después
 */
async function createAdminUser(userData) {
  try {
    console.log(`Creando administrador: ${userData.email}`);
    
    // 1. Crear el usuario en auth.users mediante la API admin de Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'admin'
      }
    });
    
    if (authError) {
      console.error('Error al crear usuario en auth:', authError);
      return { success: false, error: authError };
    }
    
    const userId = authData.user.id;
    console.log(`Usuario creado en auth con ID: ${userId}`);
    
    // 2. El trigger insertará automáticamente el registro en public.users
    // Esperamos un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Actualizamos datos adicionales en public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'admin',
        first_name: userData.first_name,
        last_name: userData.last_name,
        organization_id: userData.organization_id
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error al actualizar datos en public.users:', updateError);
      return { success: true, warning: 'Usuario creado pero hay datos que no se pudieron actualizar', user: authData.user };
    }
    
    console.log('Usuario administrador creado correctamente');
    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error general al crear usuario:', error);
    return { success: false, error };
  }
}

// Ejemplo de uso
async function createSampleAdmin() {
  const newAdminData = {
    email: 'nuevo.admin@example.com',
    password: 'AdminSeguro123!',
    first_name: 'Nuevo',
    last_name: 'Administrador',
    organization_id: '550e8400-e29b-41d4-a716-446655440000' // UUID de ejemplo
  };
  
  const result = await createAdminUser(newAdminData);
  
  if (result.success) {
    console.log('✅ Administrador creado correctamente');
    console.log('ID:', result.user.id);
    console.log('Email:', result.user.email);
    
    if (result.warning) {
      console.warn('⚠️ Advertencia:', result.warning);
    }
  } else {
    console.error('❌ Error al crear administrador:', result.error);
  }
}

// Ejecutar ejemplo
createSampleAdmin().catch(err => {
  console.error('Error fatal:', err);
}); 