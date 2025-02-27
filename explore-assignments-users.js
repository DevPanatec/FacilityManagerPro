const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para explorar asignaciones y usuarios
async function exploreAssignmentsUsers() {
  try {
    console.log('---- CONSULTANDO ASIGNACIONES CON DETALLES DE USUARIO Y ÁREA ----');
    
    // Obtenemos asignaciones con join a users y areas
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        user:user_id(id, email, role, first_name, last_name),
        area:area_id(id, name, sala_id),
        organization:organization_id(id, name)
      `)
      .limit(5);
    
    if (error) {
      console.error('Error al consultar asignaciones:', error);
      return;
    }
    
    // Formateamos la salida para mayor claridad
    console.log('\nAsignaciones detalladas:');
    data.forEach((assignment, index) => {
      console.log(`\n--- ASIGNACIÓN ${index + 1} ---`);
      console.log(`ID: ${assignment.id}`);
      console.log(`Estado: ${assignment.status}`);
      console.log(`Fecha de inicio: ${assignment.start_time}`);
      console.log(`Fecha de fin: ${assignment.end_time}`);
      
      console.log('\nInformación del usuario:');
      if (assignment.user) {
        console.log(`- ID: ${assignment.user.id}`);
        console.log(`- Email: ${assignment.user.email}`);
        console.log(`- Rol: ${assignment.user.role}`);
        console.log(`- Nombre: ${assignment.user.first_name || 'No especificado'} ${assignment.user.last_name || 'No especificado'}`);
      } else {
        console.log('- No hay información de usuario');
      }
      
      console.log('\nInformación del área:');
      if (assignment.area) {
        console.log(`- ID: ${assignment.area.id}`);
        console.log(`- Nombre: ${assignment.area.name}`);
        console.log(`- Sala ID: ${assignment.area.sala_id || 'No asignada'}`);
      } else {
        console.log('- No hay información de área');
      }
      
      console.log('\nInformación de la organización:');
      if (assignment.organization) {
        console.log(`- ID: ${assignment.organization.id}`);
        console.log(`- Nombre: ${assignment.organization.name}`);
      } else {
        console.log('- No hay información de organización');
      }
    });
    
    // Consultamos usuarios específicos que tienen asignaciones
    console.log('\n\n---- CONSULTANDO USUARIOS CON ASIGNACIONES ----');
    
    // Obtenemos la lista única de user_id de las asignaciones
    const userIds = [...new Set(data.map(a => a.user_id))];
    
    // Consultamos cada usuario con sus asignaciones
    for (const userId of userIds) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error(`Error al consultar usuario ${userId}:`, userError);
        continue;
      }
      
      console.log(`\nUsuario: ${userData.email} (${userData.role})`);
      
      // Contamos las asignaciones del usuario
      const { data: assignmentCount, error: countError } = await supabase
        .from('assignments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      if (countError) {
        console.error(`Error al contar asignaciones del usuario ${userId}:`, countError);
      } else {
        console.log(`Total de asignaciones: ${assignmentCount.length}`);
      }
    }
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutamos la exploración
exploreAssignmentsUsers().catch(error => {
  console.error('Error en la exploración:', error);
}); 