const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definimos los datos de la organización y del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userEmail = 'nuevo.admin.adminapi@facilitymanagerpro.com';
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

// Función para crear el usuario utilizando la API de administración
async function createUserWithAdminApi() {
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

    console.log('Creando nuevo usuario administrador usando la API de administración...');

    try {
      // Intentamos usar la API de admin para crear el usuario
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true, // Confirmar el email automáticamente
        user_metadata: {
          role: 'admin',
          first_name: 'Admin',
          last_name: 'AdminAPI',
          organization_id: organizationId
        }
      });

      if (adminError) {
        console.error('Error al crear el usuario con la API de admin:', adminError);
        return;
      }

      console.log('Usuario creado exitosamente con la API de admin:');
      console.log(`- ID: ${adminData.user.id}`);
      console.log(`- Email: ${adminData.user.email}`);
      console.log(`- Confirmado: ${adminData.user.email_confirmed_at ? 'Sí' : 'No'}`);
      console.log(`- Role: ${adminData.user.user_metadata?.role || 'No especificado'}`);
      console.log(`- Organización: ${adminData.user.user_metadata?.organization_id || 'No especificada'}`);

      // Ahora actualizamos la tabla users con los datos adicionales que necesitamos
      console.log('\nActualizando la tabla users...');

      // Esperamos un momento para asegurarnos de que el usuario se ha creado en auth
      await new Promise(resolve => setTimeout(resolve, 2000));

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
        console.log('El usuario no se encontró en la tabla users. Creando manualmente...');
        
        // Si no existe, intentamos una actualización upsert para crear o actualizar
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .upsert({
            id: adminData.user.id, // Usamos el mismo ID generado por auth
            email: userEmail,
            role: 'admin',
            first_name: 'Admin',
            last_name: 'AdminAPI',
            organization_id: organizationId,
            status: 'active',
            language: 'es',
            timezone: 'UTC',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (updateError) {
          console.error('Error al actualizar la tabla users:', updateError);
        } else {
          console.log('Usuario actualizado en la tabla users:', updateData);
        }
      } else {
        console.log('El usuario ya existe en la tabla users:');
        console.log(`- ID: ${userData.id}`);
        console.log(`- Email: ${userData.email}`);
        console.log(`- Role: ${userData.role}`);
        
        // Actualizamos los campos que necesitan ser actualizados
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            role: 'admin',
            first_name: 'Admin',
            last_name: 'AdminAPI',
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
          console.log('Usuario actualizado exitosamente:', updateData);
        }
      }

    } catch (error) {
      console.error('Error al usar la API de admin:', error);
      
      // Intentemos un enfoque alternativo usando SQL directo
      console.log('\nIntentando enfoque alternativo...');
      
      // Esta consulta se saltaría porque es peligrosa, pero mostramos el concepto
      console.log('Para casos extremos, se podría considerar ejecutar SQL directamente');
      console.log('mediante RPC o functions/triggers configurados en Supabase');
    }
    
  } catch (error) {
    console.error('Error general al crear el usuario:', error);
  }
}

// Ejecutamos la función principal
createUserWithAdminApi().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 