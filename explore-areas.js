const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para consultar la tabla de áreas
async function exploreAreas() {
  try {
    console.log('---- CONSULTANDO ÁREAS ----');
    
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error al consultar áreas:', error);
      return;
    }
    
    console.table(data);
    console.log(`Total de áreas: ${data.length}`);
    
    // Consultamos un área específica con sus asignaciones
    if (data && data.length > 0) {
      const areaId = data[0].id;
      console.log(`\n---- CONSULTANDO ASIGNACIONES PARA EL ÁREA ${areaId} ----`);
      
      const { data: assignments, error: assignmentError } = await supabase
        .from('assignments')
        .select('*, user:user_id(*)')
        .eq('area_id', areaId)
        .limit(5);
      
      if (assignmentError) {
        console.error('Error al consultar asignaciones:', assignmentError);
        return;
      }
      
      console.log('Asignaciones encontradas:');
      assignments.forEach((assignment, index) => {
        console.log(`\nAsignación ${index + 1}:`);
        console.log(`- ID: ${assignment.id}`);
        console.log(`- Usuario: ${assignment.user ? assignment.user.email : 'No disponible'}`);
        console.log(`- Estado: ${assignment.status}`);
        console.log(`- Inicio: ${assignment.start_time}`);
        console.log(`- Fin: ${assignment.end_time}`);
      });
    }
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutamos la exploración
exploreAreas().catch(error => {
  console.error('Error en la exploración:', error);
}); 