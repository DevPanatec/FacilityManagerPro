import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function createAdmin() {
  try {
    console.log('Creando usuario administrador...')
    
    // Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@facilitymanagerpro.com',
      password: 'Admin123456!',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creando usuario en auth:', authError.message)
      return
    }

    console.log('Usuario creado en auth:', authData.user)

    // Crear registro en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: 'admin@facilitymanagerpro.com',
          role: 'admin',
          status: 'active',
          first_name: 'Admin',
          last_name: 'System'
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('Error creando usuario en tabla users:', userError.message)
      return
    }

    console.log('Usuario creado en tabla users:', userData)

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

createAdmin() 