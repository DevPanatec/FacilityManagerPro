import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs'
)

async function checkUsersTable() {
  try {
    console.log('Consultando tabla users...')
    
    // Obtener todos los registros de la tabla users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      console.error('Error consultando tabla users:', error.message)
      return
    }

    console.log('Registros encontrados:', users)

    // Buscar registros duplicados por email
    const emailCounts = {}
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1
    })

    const duplicates = Object.entries(emailCounts)
      .filter(([email, count]) => count > 1)
      .map(([email]) => email)

    if (duplicates.length > 0) {
      console.log('Emails duplicados encontrados:', duplicates)
      
      // Mostrar los registros duplicados
      for (const email of duplicates) {
        const dupes = users.filter(u => u.email === email)
        console.log(`Registros para ${email}:`, dupes)
      }
    } else {
      console.log('No se encontraron duplicados')
    }

  } catch (err) {
    console.error('Error inesperado:', err)
  }
}

checkUsersTable() 