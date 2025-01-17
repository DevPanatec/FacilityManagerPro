const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Configurar dotenv
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSuperAdmin() {
  try {
    // Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    console.log('\nUsuarios en auth.users:')
    authUsers.users.forEach(user => {
      console.log(`- Email: ${user.email}, ID: ${user.id}`)
    })

    // Verificar usuarios en la tabla users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'superadmin')

    if (dbError) {
      throw dbError
    }

    console.log('\nUsuarios superadmin en tabla users:')
    dbUsers.forEach(user => {
      console.log(`- Email: ${user.email}, ID: ${user.id}, Role: ${user.role}`)
    })

    // Verificar si coinciden
    const authEmails = new Set(authUsers.users.map(u => u.email))
    const dbEmails = new Set(dbUsers.map(u => u.email))

    console.log('\nVerificación de coincidencia:')
    dbUsers.forEach(user => {
      if (authEmails.has(user.email)) {
        console.log(`✅ Usuario ${user.email} existe en ambas tablas`)
      } else {
        console.log(`❌ Usuario ${user.email} solo existe en tabla users`)
      }
    })

  } catch (error) {
    console.error('Error al verificar superadmin:', error)
  }
}

checkSuperAdmin() 