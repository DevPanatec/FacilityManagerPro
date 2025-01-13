import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function createTestUser() {
  try {
    console.log('Creando usuario de prueba...')
    
    // Paso 1: Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test2@example.com',
      password: 'Test123456!',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creando usuario en auth:', authError.message)
      return
    }

    console.log('Usuario creado en auth:', authData.user)

    // Paso 2: Crear registro en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: 'test2@example.com',
          role: 'admin',
          status: 'active',
          first_name: 'Test',
          last_name: 'User'
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('Error creando registro en users:', userError.message)
      return
    }

    console.log('Usuario creado en tabla users:', userData)

    // Paso 3: Probar login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test2@example.com',
      password: 'Test123456!'
    })

    if (loginError) {
      console.error('Error en login:', loginError.message)
      return
    }

    console.log('Login exitoso:', loginData.user)

    // Paso 4: Obtener datos del usuario
    const { data: users, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)

    if (getUserError) {
      console.error('Error obteniendo datos del usuario:', getUserError.message)
      return
    }

    console.log('Datos del usuario:', users[0])

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

createTestUser() 