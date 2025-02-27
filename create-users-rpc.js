const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para crear un usuario usando la nueva función RPC
async function createUserWithRPC(userData) {
  try {
    console.log(`Creando usuario: ${userData.email}...`);
    
    // Llamar a la función RPC para crear el usuario
    const { data, error } = await supabase.rpc('create_user_rpc', {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      organization_id: userData.organization_id
    });
    
    if (error) {
      console.error(`Error al crear usuario: ${error.message}`);
      return null;
    }
    
    console.log(`¡Usuario ${userData.email} creado exitosamente con ID: ${data}!`);
    return data; // El UUID del usuario creado
  } catch (error) {
    console.error(`Error general: ${error.message}`);
    return null;
  }
}

// Función para leer usuarios del CSV
function readUsersFromCSV() {
  try {
    const csvFile = path.join(__dirname, 'users-to-create-fixed.csv');
    const csvData = fs.readFileSync(csvFile, 'utf8');
    const lines = csvData.split('\n');
    
    // La primera línea es el encabezado
    const headers = lines[0].split(',');
    
    // Procesar cada línea
    const users = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const user = {};
      
      headers.forEach((header, index) => {
        user[header.trim()] = values[index]?.trim();
      });
      
      users.push(user);
    }
    
    console.log(`Leídos ${users.length} usuarios del archivo CSV`);
    return users;
  } catch (error) {
    console.error(`Error al leer el archivo CSV: ${error.message}`);
    return [];
  }
}

// Función principal
async function createUsers() {
  console.log(`===== CREANDO USUARIOS USANDO RPC =====`);
  
  const users = readUsersFromCSV();
  if (users.length === 0) {
    console.error('No se encontraron usuarios para crear');
    return;
  }
  
  // Resultados
  const results = {
    success: [],
    failed: []
  };
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`\n[${i+1}/${users.length}] Procesando: ${user.email}`);
    
    // Comprobar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    
    if (existingUser) {
      console.log(`Usuario ${user.email} ya existe, saltando...`);
      continue;
    }
    
    // Crear el usuario usando RPC
    const userId = await createUserWithRPC(user);
    
    if (userId) {
      results.success.push({
        email: user.email,
        id: userId
      });
    } else {
      results.failed.push({
        email: user.email,
        error: 'Error en la creación'
      });
    }
    
    // Esperar un poco entre cada creación
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Mostrar resumen
  console.log('\n===== RESUMEN =====');
  console.log(`Total procesados: ${users.length}`);
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Fallidos: ${results.failed.length}`);
  
  // Guardar resultados
  fs.writeFileSync('creation-results-rpc.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en creation-results-rpc.json');
}

// Ejecutar
createUsers().catch(err => {
  console.error('Error fatal:', err);
}); 