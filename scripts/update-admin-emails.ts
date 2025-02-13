import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799'

const supabase = createClient(supabaseUrl, supabaseKey)

const emailUpdates = [
  {
    oldEmail: 'hospital.san.miguel.arc.ngel.admin1@facilitymanagerpro.com',
    newEmail: 'daibethsanchez@hbc.com'
  },
  {
    oldEmail: 'hospital.san.miguel.arc.ngel.admin2@facilitymanagerpro.com',
    newEmail: 'fulviaacosta@hbc.com'
  },
  {
    oldEmail: 'hospital.san.miguel.arc.ngel.admin3@facilitymanagerpro.com',
    newEmail: 'patriciacamarena@hbc.com'
  }
]

async function updateAdminEmails() {
  try {
    for (const update of emailUpdates) {
      // 1. Actualizar el email en la tabla de autenticación
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        update.oldEmail,
        { email: update.newEmail }
      )

      if (authError) {
        console.error(`Error actualizando auth para ${update.oldEmail}:`, authError)
        continue
      }

      // 2. Actualizar el email en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({ email: update.newEmail })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (userError) {
        console.error('Error actualizando usuario:', userError.message)
        continue
      }

      console.log('Usuario actualizado:', userData)
    }

    console.log('Proceso completado')
  } catch (error) {
    console.error('Error en el proceso:', error)
  }
}

updateAdminEmails() 