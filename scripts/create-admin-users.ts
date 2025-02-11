import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const admins = [
  {
    email: 'daibethsanchez@hbc.com',
    password: 'HospitalArcangel#2025',
    firstName: 'Daibeth',
    lastName: 'Sanchez'
  },
  {
    email: 'fulviaacosta@hbc.com',
    password: 'HospitalArcangel#2025',
    firstName: 'Fulvia',
    lastName: 'Acosta'
  },
  {
    email: 'patriciacamarena@hbc.com',
    password: 'HospitalArcangel#2025',
    firstName: 'Patricia',
    lastName: 'Camarena'
  }
]

async function createAdminUsers() {
  try {
    for (const admin of admins) {
      console.log(`\nCreando usuario para ${admin.email}...`)
      
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName,
          role: 'admin'
        }
      })

      if (authError) {
        console.error(`❌ Error creando usuario auth para ${admin.email}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No se pudo crear el usuario auth para ${admin.email}`)
        continue
      }

      console.log(`✓ Usuario auth creado: ${admin.email}`)

      // 2. Crear perfil en public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: admin.email,
          first_name: admin.firstName,
          last_name: admin.lastName,
          role: 'admin',
          organization_id: organizationId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (userError) {
        console.error(`❌ Error creando perfil para ${admin.email}:`, userError.message)
        console.log('Eliminando usuario auth fallido...')
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
        if (deleteError) {
          console.error(`❌ Error eliminando usuario auth fallido:`, deleteError.message)
        } else {
          console.log('✓ Usuario auth eliminado correctamente')
        }
        continue
      }

      console.log(`✅ Usuario creado completamente: ${admin.email}`)
    }

    console.log('\n✨ Proceso completado')
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error)
  }
}

createAdminUsers() 