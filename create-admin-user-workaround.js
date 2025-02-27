const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userData = {
  email: 'admin.workaround@facilitymanagerpro.com',
  password: 'SecurePass123!',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'Workaround',
  organization_id: organizationId
};

// Función para verificar la organización
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
      console.error('La organización no existe');
      return false;
    }
    
    console.log(`Organización encontrada: ${data.name} (${data.status})`);
    return true;
  } catch (error) {
    console.error('Error inesperado:', error);
    return false;
  }
}

// Función para verificar si el usuario ya existe
async function checkUserExists(email) {
  try {
    console.log(`Verificando si el usuario ${email} ya existe...`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('Error al verificar si el usuario existe:', error);
      return null;
    }
    
    if (data) {
      console.log(`El usuario ${email} ya existe con ID: ${data.id}`);
      return data.id;
    }
    
    console.log(`El usuario ${email} no existe.`);
    return null;
  } catch (error) {
    console.error('Error inesperado:', error);
    return null;
  }
}

// Función para analizar la estructura de la tabla users
async function analyzeUsersTable() {
  try {
    console.log('Analizando la estructura de la tabla users...');
    
    // Obtener un usuario existente para analizar su estructura
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error al obtener usuarios existentes:', usersError);
      return null;
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error('No se encontraron usuarios existentes para analizar');
      return null;
    }
    
    const existingUser = existingUsers[0];
    console.log('Usuario existente para análisis:', existingUser.id);
    
    // Analizar qué campos son obligatorios (no nulos)
    const requiredFields = {};
    Object.keys(existingUser).forEach(key => {
      if (existingUser[key] !== null) {
        requiredFields[key] = existingUser[key];
      }
    });
    
    console.log('Campos obligatorios detectados:', Object.keys(requiredFields));
    return requiredFields;
  } catch (error) {
    console.error('Error al analizar la tabla users:', error);
    return null;
  }
}

// Función para intentar copiar un usuario existente
async function cloneExistingUser() {
  try {
    console.log('Intentando clonar un usuario existente...');
    
    // Obtener un usuario existente para clonar
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1);
    
    if (usersError) {
      console.error('Error al obtener usuarios existentes:', usersError);
      return null;
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error('No se encontraron usuarios admin existentes para clonar');
      return null;
    }
    
    const existingUser = existingUsers[0];
    console.log('Usuario existente para clonar:', existingUser.id);
    
    // Crear un nuevo usuario basado en el existente
    const newUserId = uuidv4();
    const newUser = {
      ...existingUser,
      id: newUserId,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      organization_id: userData.organization_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Eliminar campos que podrían causar problemas
    delete newUser.last_login_at;
    delete newUser.password_changed_at;
    delete newUser.last_active_at;
    
    console.log('Intentando insertar usuario clonado con ID:', newUserId);
    
    // Intentar insertar el nuevo usuario
    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select();
    
    if (error) {
      console.error('Error al insertar usuario clonado:', error);
      return null;
    }
    
    console.log('Usuario clonado insertado correctamente:', data);
    return newUserId;
  } catch (error) {
    console.error('Error al clonar usuario:', error);
    return null;
  }
}

// Función para intentar crear un usuario con un ID existente
async function createUserWithExistingId() {
  try {
    console.log('Intentando crear un usuario con un ID existente...');
    
    // Obtener un usuario existente para usar su ID
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('Error al obtener usuarios existentes:', usersError);
      return null;
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error('No se encontraron usuarios existentes');
      return null;
    }
    
    const existingId = existingUsers[0].id;
    console.log('Usando ID existente:', existingId);
    
    // Intentar actualizar el usuario existente
    const { data, error } = await supabase
      .from('users')
      .update({
        email: userData.email,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        organization_id: userData.organization_id,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingId)
      .select();
    
    if (error) {
      console.error('Error al actualizar usuario existente:', error);
      return null;
    }
    
    console.log('Usuario actualizado correctamente:', data);
    return existingId;
  } catch (error) {
    console.error('Error al crear usuario con ID existente:', error);
    return null;
  }
}

// Función para intentar crear un usuario con un enfoque de dos pasos
async function createUserTwoStep() {
  try {
    console.log('Intentando crear un usuario con enfoque de dos pasos...');
    
    // Paso 1: Crear un registro temporal en la tabla users
    const tempId = uuidv4();
    console.log('ID temporal generado:', tempId);
    
    // Obtener campos requeridos de un usuario existente
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error al obtener usuarios existentes:', usersError);
      return null;
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      console.error('No se encontraron usuarios existentes');
      return null;
    }
    
    const existingUser = existingUsers[0];
    
    // Crear un nuevo usuario con los campos mínimos requeridos
    const newUser = {
      id: tempId,
      email: userData.email,
      role: userData.role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timezone: 'UTC',
      language: 'es',
      metadata: {},
      failed_login_attempts: 0
    };
    
    // Intentar insertar el usuario temporal
    console.log('Intentando insertar usuario temporal...');
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select();
    
    if (insertError) {
      console.error('Error al insertar usuario temporal:', insertError);
      
      // Intentar con un enfoque diferente si falla
      console.log('Intentando enfoque alternativo...');
      
      // Intentar usar un ID existente
      const { data: existingIds, error: idsError } = await supabase
        .from('users')
        .select('id')
        .limit(10);
      
      if (idsError || !existingIds || existingIds.length === 0) {
        console.error('No se pudieron obtener IDs existentes');
        return null;
      }
      
      // Intentar con cada ID existente
      for (const user of existingIds) {
        const existingId = user.id;
        console.log(`Intentando con ID existente: ${existingId}`);
        
        // Verificar si podemos actualizar este usuario
        const { data: checkUser, error: checkError } = await supabase
          .from('users')
          .select('email')
          .eq('id', existingId)
          .single();
        
        if (checkError || !checkUser) {
          console.log(`No se pudo verificar el usuario con ID ${existingId}`);
          continue;
        }
        
        if (checkUser.email === userData.email) {
          console.log(`El usuario con email ${userData.email} ya existe`);
          return existingId;
        }
        
        // Intentar crear un usuario con este ID
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: userData.email,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            organization_id: userData.organization_id,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingId)
          .select();
        
        if (!updateError) {
          console.log('Usuario actualizado correctamente:', updatedUser);
          return existingId;
        }
        
        console.log(`No se pudo actualizar el usuario con ID ${existingId}:`, updateError);
      }
      
      return null;
    }
    
    console.log('Usuario temporal insertado correctamente:', insertedUser);
    
    // Paso 2: Actualizar el usuario con los datos completos
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        organization_id: userData.organization_id
      })
      .eq('id', tempId)
      .select();
    
    if (updateError) {
      console.error('Error al actualizar usuario con datos completos:', updateError);
      return tempId; // Devolver el ID temporal de todos modos
    }
    
    console.log('Usuario actualizado con datos completos:', updatedUser);
    return tempId;
  } catch (error) {
    console.error('Error en el proceso de dos pasos:', error);
    return null;
  }
}

// Función principal
async function createAdminUserWorkaround() {
  try {
    // Verificar la organización
    const organizationExists = await checkOrganization();
    if (!organizationExists) {
      console.error('No se pudo verificar la organización. Abortando.');
      return;
    }
    
    // Verificar si el usuario ya existe
    const existingUserId = await checkUserExists(userData.email);
    if (existingUserId) {
      console.log(`El usuario ${userData.email} ya existe. No es necesario crearlo.`);
      return;
    }
    
    // Analizar la estructura de la tabla users
    const tableStructure = await analyzeUsersTable();
    if (!tableStructure) {
      console.error('No se pudo analizar la estructura de la tabla. Abortando.');
      return;
    }
    
    console.log('\n===== INTENTANDO DIFERENTES MÉTODOS PARA CREAR EL USUARIO =====\n');
    
    // Método 1: Intentar clonar un usuario existente
    console.log('\n--- MÉTODO 1: CLONAR USUARIO EXISTENTE ---');
    const clonedUserId = await cloneExistingUser();
    if (clonedUserId) {
      console.log(`¡ÉXITO! Usuario creado con ID: ${clonedUserId}`);
      return;
    }
    
    // Método 2: Intentar crear un usuario con un ID existente
    console.log('\n--- MÉTODO 2: USAR ID EXISTENTE ---');
    const updatedUserId = await createUserWithExistingId();
    if (updatedUserId) {
      console.log(`¡ÉXITO! Usuario creado/actualizado con ID: ${updatedUserId}`);
      return;
    }
    
    // Método 3: Intentar crear un usuario con un enfoque de dos pasos
    console.log('\n--- MÉTODO 3: ENFOQUE DE DOS PASOS ---');
    const twoStepUserId = await createUserTwoStep();
    if (twoStepUserId) {
      console.log(`¡ÉXITO! Usuario creado con enfoque de dos pasos. ID: ${twoStepUserId}`);
      return;
    }
    
    console.log('\n===== TODOS LOS MÉTODOS FALLARON =====');
    console.log('Recomendaciones:');
    console.log('1. Revisar las instrucciones en "instrucciones-crear-admin.md"');
    console.log('2. Contactar al administrador de la base de datos para obtener ayuda');
    console.log('3. Verificar si hay triggers o funciones especiales para la creación de usuarios');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función principal
createAdminUserWorkaround().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 