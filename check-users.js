require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://jecxswfoepdstrghyouv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY3hzd2ZvZXBkc3RyZ2h5b3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyMTI5NTEsImV4cCI6MjA0Nzc4ODk1MX0.LbxiCt3dBJC6rEr3n_2WsmY87eUQy7_M-qFtSElB7h8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultUsers = [
  {
    email: 'superadmin@test.com',
    password: '123456',
    role: 'superadmin',
    full_name: 'Super Admin'
  },
  {
    email: 'admin@test.com',
    password: '123456',
    role: 'admin',
    full_name: 'Admin'
  },
  {
    email: 'enterprise@test.com',
    password: '123456',
    role: 'enterprise',
    full_name: 'Enterprise'
  },
  {
    email: 'usuario@test.com',
    password: '123456',
    role: 'usuario',
    full_name: 'Usuario'
  }
];

async function createDefaultUsers() {
  for (const user of defaultUsers) {
    try {
      // Intentar registrar el usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            role: user.role,
            full_name: user.full_name
          }
        }
      });

      if (authError) {
        console.error(`Error creando usuario ${user.email}:`, authError);
        continue;
      }

      console.log(`Usuario ${user.email} creado exitosamente:`, authData);
      
    } catch (error) {
      console.error(`Error inesperado creando usuario ${user.role}:`, error);
    }
  }

  // Listar usuarios existentes
  const { data: users, error: selectError } = await supabase
    .from('users')
    .select('*');

  if (selectError) {
    console.error('Error obteniendo usuarios:', selectError);
  } else {
    console.log('Usuarios encontrados:', users);
  }
}

createDefaultUsers(); 