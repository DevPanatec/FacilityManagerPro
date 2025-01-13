import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function createUserRecord() {
  try {
    console.log('Buscando usuario admin...')
    
    // Buscar usuario por email
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers()

    if (searchError) {
      console.error('Error buscando usuarios:', searchError.message)
      return
    }

    const adminUser = users.find(u => u.email === 'admin@facilitymanagerpro.com')
    
    if (!adminUser) {
      console.error('Usuario admin no encontrado')
      return
    }

    console.log('Usuario admin encontrado:', adminUser)

    // Crear registro en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          id: adminUser.id,
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
      console.error('Error creando registro de usuario:', userError.message)
      return
    }

    console.log('Registro de usuario creado:', userData)

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

createUserRecord() 