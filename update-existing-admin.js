const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con rol de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID de la organización a la que queremos asignar un administrador
const targetOrganizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'; // HospitalesGlobales

// Email del usuario administrador general que parece no tener organización asignada
const adminEmail = 'admin@facilitymanagerpro.com';

async function updateAdminOrganization() {
  console.log(`===== ACTUALIZANDO USUARIO ADMINISTRADOR PARA ORGANIZACIÓN =====`);
  console.log(`Organización objetivo: ${targetOrganizationId}`);
  console.log(`Admin email a actualizar: ${adminEmail}`);
  
  try {
    // 1. Obtener detalles del usuario admin
    console.log('\n1. Buscando detalles del usuario admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (adminError) {
      console.error('Error al buscar usuario admin:', adminError);
      return;
    }
    
    if (!adminUser) {
      console.error(`No se encontró ningún usuario con email ${adminEmail}`);
      return;
    }
    
    console.log(`Usuario encontrado con ID: ${adminUser.id}`);
    console.log(`Rol actual: ${adminUser.role}`);
    console.log(`Organización actual: ${adminUser.organization_id || 'Ninguna'}`);
    
    // 2. Verificar que la organización objetivo existe
    console.log('\n2. Verificando que la organización objetivo existe...');
    const { data: targetOrg, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', targetOrganizationId)
      .single();
    
    if (orgError) {
      console.error('Error al buscar la organización objetivo:', orgError);
      return;
    }
    
    if (!targetOrg) {
      console.error(`No se encontró la organización con ID ${targetOrganizationId}`);
      return;
    }
    
    console.log(`Organización encontrada: ${targetOrg.name} (${targetOrg.status})`);
    
    // 3. Actualizar la organización del usuario admin
    console.log('\n3. Actualizando la organización del usuario admin...');
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        organization_id: targetOrganizationId
      })
      .eq('id', adminUser.id)
      .select();
    
    if (updateError) {
      console.error('Error al actualizar la organización del usuario:', updateError);
      return;
    }
    
    console.log('¡Usuario actualizado correctamente!');
    console.log('Nuevos datos del usuario:');
    console.log(updateResult);
    
    // 4. Verificar permisos y asignaciones del usuario
    console.log('\n4. Verificando asignaciones existentes para este usuario...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, start_date, end_date, status')
      .eq('user_id', adminUser.id)
      .limit(5);
    
    if (assignmentsError) {
      console.error('Error al verificar asignaciones:', assignmentsError);
    } else if (assignments && assignments.length > 0) {
      console.log(`El usuario tiene ${assignments.length} asignaciones:`);
      assignments.forEach(assignment => {
        console.log(`- ID: ${assignment.id}, Estado: ${assignment.status}`);
      });
    } else {
      console.log('El usuario no tiene asignaciones.');
    }
    
    console.log('\n===== INSTRUCCIONES PARA USAR ESTE USUARIO =====');
    console.log('Para iniciar sesión con este usuario:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Contraseña: Solicita la contraseña al administrador del sistema`);
    console.log('\nNota: Si no conoces la contraseña, puedes restablecerla desde la interfaz de administración de Supabase.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
updateAdminOrganization().catch(err => {
  console.error('Error fatal:', err);
}); 