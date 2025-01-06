import { createClient } from '@supabase/supabase-js'

const defaultUsers = [
  // Superadmins
  {
    email: 'superadmin1@facility.com',
    password: 'SuperAdmin123!',
    role: 'superadmin',
    first_name: 'Super',
    last_name: 'Admin One'
  },
  {
    email: 'superadmin2@facility.com',
    password: 'SuperAdmin123!',
    role: 'superadmin',
    first_name: 'Super',
    last_name: 'Admin Two'
  },
  // Admins
  {
    email: 'admin1@facility.com',
    password: 'Admin123!',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'One'
  },
  {
    email: 'admin2@facility.com',
    password: 'Admin123!',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Two'
  },
  {
    email: 'admin3@facility.com',
    password: 'Admin123!',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Three'
  },
  // Enterprise
  {
    email: 'enterprise1@facility.com',
    password: 'Enterprise123!',
    role: 'enterprise',
    first_name: 'Enterprise',
    last_name: 'One'
  }
]

export async function seedDefaultUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Starting to seed default users...')

  for (const user of defaultUsers) {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (existingUser) {
        console.log(`Usuario ${user.email} ya existe, saltando...`)
        continue
      }

      // Crear usuario en auth
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        }
      })

      if (signUpError) throw signUpError

      if (!authData.user) {
        throw new Error(`No se pudo crear el usuario ${user.email}`)
      }

      // Crear usuario en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            status: 'active'
          }
        ])

      if (userError) {
        // Si falla la creación del usuario, intentar eliminar el auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw userError
      }

      console.log(`Usuario ${user.email} creado exitosamente`)

    } catch (error) {
      console.error(`Error creando usuario ${user.email}:`, error)
    }
  }

  console.log('Proceso de seeding completado')
} 