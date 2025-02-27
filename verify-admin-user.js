const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email del usuario administrador creado
const adminEmail = 'admin.workaround@facilitymanagerpro.com';

async function verifyAdminUser() {
  console.log(`===== VERIFICANDO USUARIO ADMINISTRADOR: ${adminEmail} =====\n`);

  try {
    // 1. Buscar al usuario por email
    console.log(`Buscando usuario con email: ${adminEmail}`);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (error) {
      console.error('Error al buscar el usuario:', error);
      return;
    }

    if (!user) {
      console.error(`No se encontró ningún usuario con el email ${adminEmail}`);
      return;
    }

    // 2. Mostrar detalles del usuario
    console.log('\nDetalles del usuario administrador encontrado:');
    console.log('--------------------------------------------');
    console.log(`ID:              ${user.id}`);
    console.log(`Email:           ${user.email}`);
    console.log(`Rol:             ${user.role}`);
    console.log(`Nombre:          ${user.first_name} ${user.last_name}`);
    console.log(`Estado:          ${user.status}`);
    console.log(`Organization ID: ${user.organization_id}`);
    console.log(`Creado el:       ${user.created_at}`);
    console.log(`Actualizado el:  ${user.updated_at}`);
    console.log('--------------------------------------------');

    // 3. Verificar la organización asociada
    console.log('\nVerificando detalles de la organización asociada:');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();

    if (orgError) {
      console.error('Error al obtener la organización:', orgError);
    } else if (org) {
      console.log(`Organización:    ${org.name}`);
      console.log(`Estado:          ${org.status}`);
      console.log(`ID:              ${org.id}`);
    } else {
      console.log('No se encontró la organización asociada.');
    }

    // 4. Verificar si puede autenticarse (simulación)
    console.log('\nNota: Este usuario debería poder iniciar sesión en el sistema.');
    console.log('La verificación de autenticación debe realizarse a través de la interfaz de usuario.');

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar verificación
verifyAdminUser().catch(err => {
  console.error('Error fatal:', err);
}); 