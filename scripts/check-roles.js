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

async function checkRoles() {
  try {
    // Consultar todos los roles únicos en la tabla users
    const { data: roles, error } = await supabase
      .from('users')
      .select('role')
      .not('role', 'is', null)

    if (error) {
      throw error
    }

    // Obtener roles únicos
    const uniqueRoles = [...new Set(roles.map(user => user.role))]
    
    console.log('Roles encontrados en la base de datos:')
    uniqueRoles.forEach(role => console.log(`- ${role}`))

    // Verificar si existe el rol superadmin
    if (uniqueRoles.includes('superadmin')) {
      console.log('\n✅ El rol "superadmin" está creado y en uso')
    } else {
      console.log('\n❌ El rol "superadmin" NO está creado o no está en uso')
    }

    // Verificar específicamente el rol de superadmin
    const { data: superadmins, error: superadminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'superadmin')

    if (superadminError) {
      throw superadminError
    }

    if (superadmins && superadmins.length > 0) {
      console.log('\nUsuarios con rol superadmin:')
      superadmins.forEach(admin => {
        console.log(`- Email: ${admin.email}`)
      })
    } else {
      console.log('\nNo se encontraron usuarios con rol superadmin')
    }

  } catch (error) {
    console.error('Error al verificar roles:', error)
  }
}

checkRoles() 