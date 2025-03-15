const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function renameUsers() {
  try {
    console.log('Obteniendo lista de usuarios...');
    
    // Obtener todos los usuarios con rol 'usuario' o el que corresponda
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, email')
      .or('role.eq.usuario,role.eq.enterprise')
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    console.log(`Se encontraron ${users.length} usuarios para renombrar.`);
    
    // Actualizar cada usuario con el nuevo nombre
    for (let i = 0; i < users.length && i < 75; i++) {
      const user = users[i];
      const newFirstName = `Operario ${i + 1}`;
      const newLastName = '';
      
      console.log(`Actualizando usuario ${user.email} a "${newFirstName}"`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: newFirstName,
          last_name: newLastName
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`Error al actualizar el usuario ${user.email}:`, updateError);
      } else {
        console.log(`Usuario ${user.email} actualizado correctamente.`);
      }
    }
    
    console.log('Proceso completado.');
  } catch (error) {
    console.error('Error durante el proceso:', error);
  }
}

// Ejecutar la función
renameUsers(); 