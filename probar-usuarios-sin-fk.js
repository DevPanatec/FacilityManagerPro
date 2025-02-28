const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con clave de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID de la organización específica
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';

// Método 1: Usando la función SQL create_complete_user
async function crearUsuarioConFuncionSQL(userData) {
    try {
        console.log(`\n--- MÉTODO 1: CREACIÓN DE USUARIO CON FUNCIÓN SQL ---`);
        console.log(`Creando usuario ${userData.email}...`);

        const { data, error } = await supabase.rpc('create_complete_user', {
            p_email: userData.email,
            p_password: userData.password,
            p_first_name: userData.first_name,
            p_last_name: userData.last_name,
            p_role: userData.role,
            p_organization_id: userData.organization_id
        });

        if (error) {
            console.error(`Error al crear usuario: ${error.message}`);
            return null;
        }

        console.log(`Usuario creado exitosamente con ID: ${data}`);
        return data;
    } catch (error) {
        console.error(`Error general: ${error.message}`);
        return null;
    }
}

// Método 2: Usando inserción directa en public.users (ahora posible)
async function crearUsuarioDirectamente(userData) {
    try {
        console.log(`\n--- MÉTODO 2: CREACIÓN DIRECTA EN public.users ---`);
        console.log(`Creando usuario ${userData.email} directamente...`);
        
        // Generar UUID para el usuario
        const userId = crypto.randomUUID();
        
        // Insertar directamente en public.users
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                role: userData.role,
                organization_id: userData.organization_id,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error(`Error al insertar en public.users: ${error.message}`);
            return null;
        }
        
        console.log(`Usuario creado exitosamente en public.users con ID: ${data.id}`);
        
        // Esperar un momento para que el trigger actúe
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar si el usuario se sincronizó con auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError) {
            console.error(`Error al verificar usuario en auth.users: ${authError.message}`);
        } else if (authData && authData.user) {
            console.log(`Usuario correctamente sincronizado con auth.users, email: ${authData.user.email}`);
        } else {
            console.warn(`No se encontró el usuario en auth.users. El trigger podría no haber funcionado correctamente.`);
        }
        
        return data.id;
    } catch (error) {
        console.error(`Error general: ${error.message}`);
        return null;
    }
}

// Verificar usuario en ambas tablas
async function verificarUsuario(userId) {
    try {
        console.log(`\n--- VERIFICACIÓN DE USUARIO ---`);
        console.log(`Verificando usuario con ID: ${userId}`);
        
        // Verificar en public.users
        const { data: publicData, error: publicError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (publicError) {
            console.error(`Error al verificar en public.users: ${publicError.message}`);
        } else if (publicData) {
            console.log(`✓ Usuario encontrado en public.users: ${publicData.email}`);
            console.log(`  - Nombre: ${publicData.first_name} ${publicData.last_name}`);
            console.log(`  - Rol: ${publicData.role}`);
            console.log(`  - Estado: ${publicData.status}`);
        } else {
            console.warn(`✗ Usuario NO encontrado en public.users`);
        }
        
        // Verificar en auth.users mediante la API de administración
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError) {
            console.error(`Error al verificar en auth.users: ${authError.message}`);
        } else if (authData && authData.user) {
            console.log(`✓ Usuario encontrado en auth.users: ${authData.user.email}`);
            const metadata = authData.user.user_metadata || {};
            console.log(`  - Nombre: ${metadata.first_name || 'N/A'} ${metadata.last_name || 'N/A'}`);
            console.log(`  - Verificado: ${metadata.email_verified ? 'Sí' : 'No'}`);
        } else {
            console.warn(`✗ Usuario NO encontrado en auth.users`);
        }
        
        return { publicExists: !!publicData, authExists: !!(authData && authData.user) };
    } catch (error) {
        console.error(`Error general al verificar usuario: ${error.message}`);
        return { publicExists: false, authExists: false };
    }
}

// Prueba de inicio de sesión
async function probarInicioSesion(email, password) {
    try {
        console.log(`\n--- PRUEBA DE INICIO DE SESIÓN ---`);
        console.log(`Intentando iniciar sesión con ${email}...`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            console.error(`Error al iniciar sesión: ${error.message}`);
            return false;
        }
        
        console.log(`✓ Inicio de sesión exitoso!`);
        console.log(`  - Usuario: ${data.user.email}`);
        console.log(`  - Sesión válida: ${!!data.session}`);
        
        return true;
    } catch (error) {
        console.error(`Error general al iniciar sesión: ${error.message}`);
        return false;
    }
}

// Crear usuario administrador para la organización
async function crearAdministrador() {
    console.log('===== CREANDO USUARIO ADMINISTRADOR SIN RESTRICCIÓN FK =====');
    
    // Datos del usuario
    const adminUser = {
        email: 'admin.sin.fk@hospitalintegrado.com',
        password: 'Admin123!',
        first_name: 'Administrador',
        last_name: 'Sin FK',
        role: 'admin',
        organization_id: organizationId
    };
    
    // Verificar si la organización existe
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name, status')
        .eq('id', organizationId)
        .single();
    
    if (orgError) {
        console.error(`Error al verificar organización: ${orgError.message}`);
        return;
    }
    
    console.log(`Organización encontrada: ${orgData.name} (${orgData.status})`);
    
    // Método 1: Usando la función SQL create_complete_user
    let userId = await crearUsuarioConFuncionSQL(adminUser);
    
    if (userId) {
        // Verificar el usuario creado
        await verificarUsuario(userId);
        
        // Probar inicio de sesión
        await probarInicioSesion(adminUser.email, adminUser.password);
        
        // Eliminar este usuario para la siguiente prueba
        console.log(`\nEliminando usuario de prueba con ID: ${userId}`);
        await supabase.from('users').delete().eq('id', userId);
        console.log(`Usuario eliminado para la siguiente prueba`);
    }
    
    // Método 2: Usando inserción directa en public.users
    // Cambiar el email para evitar conflictos
    adminUser.email = 'admin.directo@hospitalintegrado.com';
    userId = await crearUsuarioDirectamente(adminUser);
    
    if (userId) {
        // Verificar el usuario creado
        await verificarUsuario(userId);
        
        // Probar inicio de sesión (probablemente fallará sin configurar la contraseña correctamente)
        const loginExito = await probarInicioSesion(adminUser.email, adminUser.password);
        
        if (!loginExito) {
            console.log(`\nNota: El inicio de sesión puede fallar con el método directo si los triggers no establecen la contraseña correctamente.`);
            console.log(`En este caso, necesitarías actualizar la contraseña manualmente o usar el primer método.`);
        }
    }
    
    // Guardar resultados
    const result = {
        timestamp: new Date().toISOString(),
        organization: orgData.name,
        methods_tested: [
            {
                name: "SQL Function",
                user_email: "admin.sin.fk@hospitalintegrado.com",
                success: !!userId,
                user_id: userId
            },
            {
                name: "Direct Insert",
                user_email: "admin.directo@hospitalintegrado.com",
                success: !!userId,
                user_id: userId
            }
        ],
        notes: "Este script prueba la creación de usuarios después de eliminar la restricción de clave foránea y configurar triggers"
    };
    
    fs.writeFileSync('prueba-sin-fk-resultados.json', JSON.stringify(result, null, 2));
    console.log(`\nResultados guardados en prueba-sin-fk-resultados.json`);
}

// Ejecutar prueba
crearAdministrador().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
}); 