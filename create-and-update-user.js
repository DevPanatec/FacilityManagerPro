const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definimos los datos de la organización y del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userEmail = 'admin.twostep@facilitymanagerpro.com';
const userPassword = 'Abc123456!'; // Contraseña que cumple con requisitos mínimos

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

// Función para crear y luego actualizar el usuario
async function createAndUpdateUser() {
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
      .eq('email', userEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar si el usuario ya existe:', checkError);
      return;
    }

    if (existingUser) {
      console.error(`El usuario con email ${userEmail} ya existe.`);
      return;
    }

    console.log('PASO 1: Intentando crear un usuario básico con signUp...');

    // Paso 1: Crear un usuario básico sin metadatos adicionales
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword
    });

    if (authError) {
      console.error('Error al crear el usuario básico:', authError);
      return;
    }

    console.log('Usuario básico creado con éxito');
    console.log(`- ID: ${authData.user.id}`);
    console.log(`- Email: ${authData.user.email}`);

    // Esperamos un momento para que el usuario se propague a la tabla users
    console.log('Esperando a que el usuario se propague...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\nPASO 2: Verificando si el usuario se creó en la tabla users...');
    
    // Paso 2: Verificar si el usuario se ha creado en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (userError) {
      console.error('Error al verificar el usuario en la tabla users:', userError);
      return;
    }

    if (!userData) {
      console.log('El usuario no se ha encontrado en la tabla users. Intentando crear manualmente...');
      
      // Intentar insertar el usuario manualmente
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userEmail,
          role: 'admin',
          organization_id: organizationId,
          status: 'active',
          language: 'es',
          timezone: 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
          failed_login_attempts: 0
        })
        .select();

      if (insertError) {
        console.error('Error al insertar el usuario en la tabla users:', insertError);
      } else {
        console.log('Usuario insertado manualmente en la tabla users');
        console.log(insertData);
      }
    } else {
      console.log('Usuario encontrado en la tabla users. Actualizando...');
      
      // Paso 3: Actualizar el usuario con los datos adicionales
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          organization_id: organizationId,
          status: 'active',
          language: 'es',
          timezone: 'UTC',
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)
        .select();

      if (updateError) {
        console.error('Error al actualizar el usuario:', updateError);
      } else {
        console.log('Usuario actualizado exitosamente');
        console.log(updateData);
      }
    }

    console.log('\nPASO 3: Actualizando metadatos del usuario en auth...');
    
    // Paso 4: Actualizar los metadatos del usuario en auth
    try {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        {
          user_metadata: {
            role: 'admin',
            organization_id: organizationId
          }
        }
      );

      if (metadataError) {
        console.error('Error al actualizar los metadatos del usuario:', metadataError);
      } else {
        console.log('Metadatos del usuario actualizados exitosamente');
      }
    } catch (err) {
      console.error('Error al intentar actualizar los metadatos:', err);
    }

    console.log('\nPASO 4: Verificación final del usuario...');
    
    // Paso 5: Verificación final
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (finalError) {
      console.error('Error al verificar el usuario final:', finalError);
    } else if (finalUser) {
      console.log('Datos finales del usuario:');
      console.log(`- ID: ${finalUser.id}`);
      console.log(`- Email: ${finalUser.email}`);
      console.log(`- Role: ${finalUser.role}`);
      console.log(`- Organización: ${finalUser.organization_id}`);
      console.log(`- Estado: ${finalUser.status}`);
    } else {
      console.log('No se encontró el usuario en la verificación final');
    }

  } catch (error) {
    console.error('Error general al crear y actualizar el usuario:', error);
  }
}

// Ejecutamos la función principal
createAndUpdateUser().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 