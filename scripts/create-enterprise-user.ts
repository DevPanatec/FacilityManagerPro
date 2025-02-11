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

const enterpriseUser = {
  email: 'elsamudio@minsa.gob.pa',
  password: 'hsmaminsa!',
  firstName: 'Elsa',
  lastName: 'Mudio'
}

async function createEnterpriseUser() {
  try {
    console.log(`\nCreando usuario enterprise ${enterpriseUser.email}...`)
    
    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: enterpriseUser.email,
      password: enterpriseUser.password,
      email_confirm: true,
      user_metadata: {
        first_name: enterpriseUser.firstName,
        last_name: enterpriseUser.lastName,
        role: 'enterprise'
      }
    })

    if (authError) {
      console.error(`❌ Error creando usuario auth:`, authError.message)
      return
    }

    if (!authData.user) {
      console.error(`❌ No se pudo crear el usuario auth`)
      return
    }

    console.log(`✓ Usuario auth creado: ${enterpriseUser.email}`)

    // 2. Crear perfil en public.users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: enterpriseUser.email,
        first_name: enterpriseUser.firstName,
        last_name: enterpriseUser.lastName,
        role: 'enterprise',
        organization_id: organizationId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userError) {
      console.error(`❌ Error creando perfil:`, userError.message)
      console.log('Eliminando usuario auth fallido...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
      if (deleteError) {
        console.error(`❌ Error eliminando usuario auth fallido:`, deleteError.message)
      } else {
        console.log('✓ Usuario auth eliminado correctamente')
      }
      return
    }

    console.log(`✅ Usuario enterprise creado completamente: ${enterpriseUser.email}`)
    console.log('\n✨ Proceso completado')
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error)
  }
}

createEnterpriseUser() 