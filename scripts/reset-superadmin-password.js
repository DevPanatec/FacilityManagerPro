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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const NEW_PASSWORD = 'Superadmin2024!'

async function resetSuperAdminPassword() {
  try {
    // Obtener usuarios superadmin
    const { data: superadmins, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'superadmin')

    if (queryError) {
      throw queryError
    }

    console.log('\nRestableciendo contraseñas para superadmins:')
    
    for (const admin of superadmins) {
      try {
        // Actualizar contraseña
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          admin.id,
          { password: NEW_PASSWORD }
        )

        if (updateError) {
          console.error(`❌ Error al actualizar ${admin.email}:`, updateError.message)
        } else {
          console.log(`✅ Contraseña actualizada para ${admin.email}`)
        }
      } catch (error) {
        console.error(`❌ Error al procesar ${admin.email}:`, error)
      }
    }

    console.log('\nNueva contraseña para todos los superadmins:', NEW_PASSWORD)

  } catch (error) {
    console.error('Error al restablecer contraseñas:', error)
  }
}

resetSuperAdminPassword() 