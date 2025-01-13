import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function resetAdmin() {
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

    // Actualizar contraseña
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: 'Admin123456!' }
    )

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError.message)
      return
    }

    console.log('Contraseña actualizada exitosamente')

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

resetAdmin() 