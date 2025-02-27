const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función simplificada para crear un usuario manualmente
async function createUserManually(userData) {
  try {
    console.log(`Creando usuario: ${userData.email}...`);

    // 1. Generar un UUID para el usuario
    const userId = crypto.randomUUID();
    
    // 2. Insertar en auth.users (con estructura simplificada)
    const { error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      }
    });
    
    if (authError) {
      console.error(`Error al crear usuario en auth: ${authError.message}`);
      return null;
    }
    
    // 3. Buscar el ID que se generó en auth
    const { data: authUser, error: findError } = await supabase.auth.admin.listUsers({
      page: 1, 
      perPage: 100
    });
    
    if (findError || !authUser) {
      console.error('Error al buscar el usuario creado');
      return null;
    }
    
    const createdUser = authUser.users.find(u => u.email === userData.email);
    if (!createdUser) {
      console.error('No se encontró el usuario recién creado');
      return null;
    }
    
    // 4. Insertar en public.users
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: createdUser.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        organization_id: userData.organization_id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timezone: 'UTC',
        language: 'es',
        metadata: {},
        failed_login_attempts: 0
      });
    
    if (usersError) {
      console.error(`Error al insertar en users: ${usersError.message}`);
      return null;
    }
    
    console.log(`¡Usuario ${userData.email} creado exitosamente!`);
    return createdUser.id;
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
  console.log(`===== CREANDO USUARIOS =====`);
  
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
    
    // Comprobar si la organización existe
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', user.organization_id)
      .maybeSingle();
    
    if (orgError || !org) {
      console.error(`Error: La organización con ID ${user.organization_id} no existe`);
      results.failed.push({
        email: user.email,
        error: 'Organización no encontrada'
      });
      continue;
    }
    
    console.log(`Organización encontrada: ${org.name}`);
    
    // Crear el usuario
    const userId = await createUserManually(user);
    
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
  fs.writeFileSync('creation-results.json', JSON.stringify(results, null, 2));
  console.log('Resultados guardados en creation-results.json');
}

// Ejecutar
createUsers().catch(err => {
  console.error('Error fatal:', err);
}); 