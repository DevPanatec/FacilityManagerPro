const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de correos de usuarios a verificar (los que acabamos de crear)
const userEmails = [
  'admin1@hospitalintegrado.com',
  'admin2@hospitalintegrado.com',
  'admin3@hospitalintegrado.com',
  'admin4@hospitalintegrado.com',
  'admin5@hospitalintegrado.com',
  'coordinador1@hospitalintegrado.com',
  'coordinador2@hospitalintegrado.com',
  'coordinador3@hospitalintegrado.com'
];

// Función para verificar un usuario en auth.users
async function verifyUserInAuth(userId) {
  try {
    // Actualizar los metadatos del usuario y marcar como verificado
    const { data, error } = await supabase.rpc('update_user_verified_flags', {
      user_id: userId,
      is_verified: true,
      is_confirmed: true
    });
    
    if (error) {
      // Si la función RPC no existe, intentar una actualización directa
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            email_verified: true,
            phone_verified: true,
            verified: true,
            complete_profile: true
          },
          app_metadata: {
            verified: true,
            status: 'active'
          },
          email_confirm: true
        });
        
        if (updateError) {
          console.error(`Error al actualizar usuario ${userId} en auth:`, updateError);
          return false;
        }
        
        return true;
      } catch (updateError) {
        console.error(`Error al actualizar usuario ${userId} en auth:`, updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error general al verificar usuario ${userId}:`, error);
    return false;
  }
}

// Función para actualizar un usuario en la tabla users
async function updateUserInTable(userId) {
  try {
    // Actualizar el usuario en la tabla public.users
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      // Si la columna 'verified' no existe, intentar solo con status
      const { error: statusError } = await supabase
        .from('users')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (statusError) {
        console.error(`Error al actualizar usuario ${userId} en tabla:`, statusError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error general al actualizar usuario ${userId} en tabla:`, error);
    return false;
  }
}

// Función para obtener el ID de un usuario por email
async function getUserIdByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.error(`Error al obtener ID para ${email}:`, error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error(`Error general al obtener ID para ${email}:`, error);
    return null;
  }
}

// Función para implementar una función RPC si no existe
async function createVerificationFunction() {
  try {
    const { data, error } = await supabase.rpc('function_exists', {
      function_name: 'update_user_verified_flags'
    });
    
    const functionExists = data && data === true;
    
    if (!functionExists) {
      console.log('Creando función de verificación en la base de datos...');
      
      // Este SQL sería ejecutado idealmente por el DBA
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION update_user_verified_flags(
          user_id UUID,
          is_verified BOOLEAN,
          is_confirmed BOOLEAN
        ) RETURNS BOOLEAN AS $$
        DECLARE
          success BOOLEAN := false;
        BEGIN
          -- Actualizar en auth.users
          UPDATE auth.users
          SET 
            email_confirmed_at = CASE WHEN is_confirmed THEN now() ELSE email_confirmed_at END,
            raw_user_meta_data = jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    COALESCE(raw_user_meta_data, '{}'::jsonb),
                    '{email_verified}', 
                    CASE WHEN is_verified THEN 'true'::jsonb ELSE 'false'::jsonb END
                  ),
                  '{phone_verified}', 
                  CASE WHEN is_verified THEN 'true'::jsonb ELSE 'false'::jsonb END
                ),
                '{verified}',
                CASE WHEN is_verified THEN 'true'::jsonb ELSE 'false'::jsonb END
              ),
              '{complete_profile}',
              CASE WHEN is_verified THEN 'true'::jsonb ELSE 'false'::jsonb END
            ),
            raw_app_meta_data = jsonb_set(
              COALESCE(raw_app_meta_data, '{}'::jsonb),
              '{verified}',
              CASE WHEN is_verified THEN 'true'::jsonb ELSE 'false'::jsonb END
            ),
            updated_at = now()
          WHERE id = user_id;
          
          success := true;
          RETURN success;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN false;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        GRANT EXECUTE ON FUNCTION update_user_verified_flags TO service_role;
      `;
      
      console.log('Por favor, ejecuta el siguiente SQL en el editor SQL de Supabase:');
      console.log(createFunctionSQL);
    }
    
    return functionExists;
  } catch (error) {
    console.error('Error al verificar o crear la función RPC:', error);
    return false;
  }
}

// Función principal
async function verifyAllUsers() {
  console.log('===== VERIFICANDO TODOS LOS USUARIOS =====');
  
  // Primero, intentamos crear la función de verificación si no existe
  await createVerificationFunction();
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const email of userEmails) {
    console.log(`\nProcesando: ${email}`);
    
    // Obtener el ID del usuario
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      console.error(`No se encontró ID para el usuario ${email}`);
      results.failed.push({
        email,
        error: 'Usuario no encontrado'
      });
      continue;
    }
    
    console.log(`ID del usuario: ${userId}`);
    
    // Verificar en auth.users
    console.log('Verificando usuario en sistema de autenticación...');
    const authSuccess = await verifyUserInAuth(userId);
    
    // Actualizar en public.users
    console.log('Actualizando usuario en tabla de usuarios...');
    const tableSuccess = await updateUserInTable(userId);
    
    if (authSuccess && tableSuccess) {
      console.log(`✅ Usuario ${email} verificado exitosamente`);
      results.success.push({
        email,
        id: userId
      });
    } else {
      console.error(`❌ Error al verificar usuario ${email}`);
      results.failed.push({
        email,
        id: userId,
        error: `Auth: ${authSuccess}, Table: ${tableSuccess}`
      });
    }
  }
  
  // Mostrar resumen
  console.log('\n===== RESUMEN =====');
  console.log(`Total procesados: ${userEmails.length}`);
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Fallidos: ${results.failed.length}`);
  
  // Guardar resultados
  fs.writeFileSync('verification-results.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en verification-results.json');
  
  return results;
}

// Ejecutar
verifyAllUsers().catch(err => {
  console.error('Error fatal:', err);
}); 