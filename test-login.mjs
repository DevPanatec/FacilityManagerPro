import { createClient } from '@supabase/supabase-js'

// Cliente para autenticación (anon key)
const authClient = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.EGnF81c5_pZnQvmrygjcLVppWOQS5pIwAkiLxOucpjY'
)

// Cliente para acceso a datos (service role key)
const dbClient = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function testLogin() {
  try {
    console.log('Intentando login...')
    
    // Paso 1: Login con Supabase Auth
    const { data, error: authError } = await authClient.auth.signInWithPassword({
      email: 'admin@facilitymanagerpro.com',
      password: 'Admin123456!'
    })

    if (authError) {
      console.error('Error de autenticación:', authError.message)
      return
    }

    console.log('Autenticación exitosa:', data.user)

    // Paso 2: Obtener datos del usuario usando el cliente con service role
    const { data: users, error: userError } = await dbClient
      .from('users')
      .select('*')

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError.message)
      return
    }

    console.log('Usuarios encontrados:', users)

    // Paso 3: Buscar el usuario específico
    const userData = users.find(u => u.id === data.user.id)
    
    if (!userData) {
      console.error('No se encontró el usuario en la tabla users')
      return
    }

    console.log('Datos del usuario:', userData)

    // Paso 4: Verificar el rol
    if (!userData.role) {
      console.error('El usuario no tiene un rol asignado')
      return
    }

    console.log('Login exitoso como', userData.role)

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

testLogin() 