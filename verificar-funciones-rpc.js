const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con clave de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarFuncionesRPC() {
  console.log('===== VERIFICANDO FUNCIONES RPC EN SUPABASE =====');

  try {
    // Consultar todas las funciones en el esquema public
    const { data: funciones, error } = await supabase
      .rpc('list_database_functions');
    
    if (error) {
      console.error('Error al consultar funciones RPC:', error.message);
      
      // Intentar otro enfoque, consultando directamente a pg_proc
      console.log('Intentando alternativa...');
      
      const { data: funcionesAlt, error: errorAlt } = await supabase.from('pg_proc')
        .select('proname')
        .contains('proname', 'create_user');
      
      if (errorAlt) {
        console.error('Error en la consulta alternativa:', errorAlt.message);
      } else if (funcionesAlt && funcionesAlt.length > 0) {
        console.log('Funciones encontradas (alternativa):', funcionesAlt);
      } else {
        console.log('No se encontraron funciones mediante el método alternativo');
      }
      
      // Intentar llamar directamente a create_user_rpc con los parámetros de ejemplo
      console.log('Intentando llamar a create_user_rpc directamente...');
      
      const { data: resultadoCreacion, error: errorCreacion } = await supabase
        .rpc('create_user_rpc', {
          user_email: 'prueba@example.com',
          user_first_name: 'Prueba',
          user_last_name: 'Test',
          user_id: 'test-id-1234',
          user_organization_id: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
          user_password: 'Password123!',
          user_role: 'admin'
        });
      
      if (errorCreacion) {
        console.error('Error al llamar a create_user_rpc:', errorCreacion.message);
      } else {
        console.log('Resultado de crear usuario:', resultadoCreacion);
      }
      
      return;
    }
    
    if (!funciones || funciones.length === 0) {
      console.log('No se encontraron funciones RPC');
      return;
    }
    
    console.log('Funciones RPC encontradas:', funciones);
    
    // Buscar funciones relacionadas con usuarios
    const funcionesUsuario = funciones.filter(f => 
      f.function_name.toLowerCase().includes('user') || 
      f.function_name.toLowerCase().includes('usuario')
    );
    
    console.log('\nFunciones relacionadas con usuarios:');
    console.log(funcionesUsuario);
    
    // Verificar específicamente create_user_rpc
    const createUserFunction = funciones.find(f => 
      f.function_name === 'create_user_rpc'
    );
    
    if (createUserFunction) {
      console.log('\n✅ La función create_user_rpc EXISTE');
      console.log('Detalles:', createUserFunction);
    } else {
      console.log('\n❌ La función create_user_rpc NO EXISTE');
    }
    
    // Intentar llamar a la función de todos modos
    console.log('\nIntentando llamar a create_user_rpc...');
    const testId = 'test-' + Math.random().toString(36).substring(2, 10);
    
    const { data: resultadoCreacion, error: errorCreacion } = await supabase
      .rpc('create_user_rpc', {
        user_email: 'prueba@example.com',
        user_first_name: 'Prueba',
        user_last_name: 'Test',
        user_id: testId,
        user_organization_id: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
        user_password: 'Password123!',
        user_role: 'admin'
      });
    
    if (errorCreacion) {
      console.error('Error al llamar a create_user_rpc:', errorCreacion.message);
    } else {
      console.log('Resultado de crear usuario:', resultadoCreacion);
    }
    
  } catch (err) {
    console.error('Error fatal:', err);
  }
}

// Ejecutar la verificación
verificarFuncionesRPC()
  .catch(err => console.error('Error inesperado:', err))
  .finally(() => console.log('\n===== VERIFICACIÓN COMPLETADA =====')); 