import fetch from 'node-fetch';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wldiefpqmfjxernvuywv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.EGnF81c5_pZnQvmrygjcLVppWOQS5pIwAkiLxOucpjY';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  fs.writeFileSync('signup-response.json', JSON.stringify(data, null, 2));
  console.log('Respuesta guardada en signup-response.json');
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  fs.writeFileSync('signin-response.json', JSON.stringify(data, null, 2));
  console.log('Token guardado en signin-response.json');
  return data;
}

async function queryTable(table, accessToken = null) {
  let client;
  if (accessToken) {
    client = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );
  } else {
    client = supabase;
  }

  const { data, error } = await client.from(table).select('*');
  
  if (error) {
    console.error('Error querying table:', error);
    throw error;
  }
  
  fs.writeFileSync(`${table}-data.json`, JSON.stringify(data, null, 2));
  console.log(`Datos guardados en ${table}-data.json`);
  return data;
}

async function insertData(table, data, accessToken = null) {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  // Obtener el user_id del token
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError) throw userError;

  // Agregar el owner_id a los datos
  const dataWithOwnerId = {
    ...data,
    owner_id: user.id
  };

  const { data: result, error } = await supabase
    .from(table)
    .insert(dataWithOwnerId)
    .select();
  
  if (error) throw error;
  
  fs.writeFileSync(`${table}-insert-response.json`, JSON.stringify(result, null, 2));
  console.log(`Datos insertados correctamente en la tabla ${table}`);
  console.log(`Respuesta guardada en ${table}-insert-response.json`);
  return result;
}

async function insertChatRoomMember(roomId, userId, accessToken) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase.auth.setSession({ access_token: accessToken });

    // Primero obtenemos el organization_id del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error getting user organization:', userError);
      throw userError;
    }

    const { data, error } = await supabase
      .from('chat_room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        organization_id: userData.organization_id,
        role: 'member',
        status: 'active',
        last_read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting chat room member:', error);
      throw error;
    }

    console.log('Chat room member inserted successfully:', data);
    fs.writeFileSync('chat-room-member-insert-response.json', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error in insertChatRoomMember:', error);
    throw error;
  }
}

async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

async function getUserOrganizations(accessToken) {
  const client = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  // Obtener los detalles de todas las organizaciones
  const { data: orgData, error: orgError } = await client
    .from('organizations')
    .select('*');

  if (orgError) {
    console.error('Error getting organizations:', orgError);
    throw orgError;
  }

  fs.writeFileSync('organizations-data.json', JSON.stringify(orgData, null, 2));
  console.log('Datos guardados en organizations-data.json');
  return orgData;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'signup': {
        const signupEmail = args[1];
        const signupPassword = args[2];
        const role = args[3];
        if (!signupEmail || !signupPassword) {
          console.error('Para registrarse necesitas proporcionar email y password');
          process.exit(1);
        }
        await signUp(signupEmail, signupPassword, role);
        break;
      }
      case 'signin': {
        const signinEmail = args[1];
        const signinPassword = args[2];
        if (!signinEmail || !signinPassword) {
          console.error('Para iniciar sesión necesitas proporcionar email y password');
          process.exit(1);
        }
        await signIn(signinEmail, signinPassword);
        break;
      }
      case 'query': {
        const table = args[1];
        const token = args[2];
        if (!table) {
          console.error('No table specified');
          process.exit(1);
        }
        if (!token) {
          console.error('No access token provided');
          process.exit(1);
        }
        try {
          if (table === 'organizations') {
            // Si estamos consultando organizaciones, usamos la función específica
            await getUserOrganizations(token);
          } else {
            await queryTable(table, token);
          }
        } catch (error) {
          console.error('Error executing query:', error);
          process.exit(1);
        }
        break;
      }
      case 'insert': {
        const table = args[1];
        const data = args[2];
        const token = args[3];
        if (!table || !data) {
          console.error('Para insertar necesitas proporcionar la tabla y los datos en formato JSON');
          process.exit(1);
        }
        if (!token) {
          console.error('No access token provided');
          process.exit(1);
        }
        
        try {
          const jsonData = JSON.parse(data);
          await insertData(table, jsonData, token);
        } catch (error) {
          console.error('Error al parsear el JSON:', error.message);
          process.exit(1);
        }
        break;
      }
      case 'insert-chat-member': {
        const roomId = args[1];
        const userId = args[2];
        const token = args[3];
        if (!roomId || !userId) {
          console.error('Usage: node query-db.js insert-chat-member ROOM_ID USER_ID ACCESS_TOKEN');
          process.exit(1);
        }
        if (!token) {
          console.error('No access token provided');
          process.exit(1);
        }
        await insertChatRoomMember(roomId, userId, token);
        break;
      }
      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 