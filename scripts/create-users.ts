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

const users = [
  { name: 'DAYSI ACOSTA' },
  { name: 'ABRAHAM BRYAN' },
  { name: 'GLADYS CACERES' },
  { name: 'ANA CARUPIA' },
  { name: 'FRANKLIN CASTILLO' },
  { name: 'ERIKA CUBILLA' },
  { name: 'GLORIA CURLEY' },
  { name: 'YESSENIA DE LA CRUZ' },
  { name: 'YAJAHIRA DOBLAS' },
  { name: 'JUDITH EALY' },
  { name: 'YUMISOL GARIBALDI' },
  { name: 'XAVIER GITTENS' },
  { name: 'CRISTINE JORDAN' },
  { name: 'CINDY LINARES' },
  { name: 'AIXA LOPEZ' },
  { name: 'FRANCISCA MONTALVO' },
  { name: 'JANETH MONTENEGRO' },
  { name: 'ROSA MOORE' },
  { name: 'MELANIE MORALES' },
  { name: 'ROSA MORALES' },
  { name: 'CARLOS NAVARRO' },
  { name: 'ANA PALACIOS' },
  { name: 'GILBERT PALACIO' },
  { name: 'BETSAIDA PEÑALBA' },
  { name: 'YARKELYS PINEDA' },
  { name: 'LUIS PINTO' },
  { name: 'REINALDO REYES' },
  { name: 'LORENA RODRIGUEZ' },
  { name: 'MARIBEL RODRIGUEZ' },
  { name: 'EDUARDO SALDIVAR' },
  { name: 'ANTHONY SANCHEZ' },
  { name: 'ROBERTO SANTANDER' },
  { name: 'REYNALDO SANTOS' },
  { name: 'MARLENE SARMALIS' },
  { name: 'ANA SPENCER' },
  { name: 'ROSA VASQUEZ' },
  { name: 'FULVIA ACOSTA' },
  { name: 'DAIBETH SANCHEZ' }
]

async function createUsers() {
  try {
    for (const user of users) {
      const names = user.name.split(' ')
      const firstName = names[0]
      const lastName = names.slice(1).join(' ')
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}@hbc.com`
      const password = 'HospitalArcangel#2024'

      console.log(`\nCreando usuario para ${user.name}...`)
      
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'usuario'
        }
      })

      if (authError) {
        console.error(`❌ Error creando usuario auth para ${user.name}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No se pudo crear el usuario auth para ${user.name}`)
        continue
      }

      console.log(`✓ Usuario auth creado: ${email}`)

      // 2. Crear perfil en public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: 'usuario',
          organization_id: organizationId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (userError) {
        console.error(`❌ Error creando perfil para ${user.name}:`, userError.message)
        // Eliminar usuario auth si falla la creación del perfil
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
        if (deleteError) {
          console.error(`❌ Error eliminando usuario auth fallido:`, deleteError.message)
        } else {
          console.log('✓ Usuario auth eliminado correctamente')
        }
        continue
      }

      console.log(`✅ Usuario creado completamente: ${user.name} (${email})`)
    }

    console.log('\n✨ Proceso completado')
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error)
  }
}

createUsers() 