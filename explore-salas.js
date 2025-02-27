const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para explorar las salas
async function exploreSalas() {
  try {
    console.log('---- CONSULTANDO SALAS ----');
    
    const { data, error } = await supabase
      .from('salas')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error al consultar salas:', error);
      return;
    }
    
    console.table(data);
    console.log(`Total de salas: ${data.length}`);
    
    // Si hay salas, exploramos las áreas asociadas a la primera sala
    if (data && data.length > 0) {
      const salaId = data[0].id;
      console.log(`\n---- ÁREAS ASOCIADAS A LA SALA ${data[0].nombre} (ID: ${salaId}) ----`);
      
      const { data: areas, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('sala_id', salaId)
        .limit(10);
      
      if (areasError) {
        console.error('Error al consultar áreas asociadas:', areasError);
        return;
      }
      
      console.table(areas);
      console.log(`Total de áreas asociadas: ${areas.length}`);
    }
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Ejecutamos la exploración
exploreSalas().catch(error => {
  console.error('Error en la exploración:', error);
}); 