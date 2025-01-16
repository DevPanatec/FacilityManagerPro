import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const enterpriseUsers = [
  {
    email: 'instituto.de.salud.mental.mat.as.hern.ndez.enterprise@facilitymanagerpro.com',
    password: 'InstitutoHernandez#2024'
  },
  {
    email: 'hospital.dr.joaqu.n.pablo.franco.sayas.enterprise@facilitymanagerpro.com',
    password: 'HospitalFranco#2024'
  },
  {
    email: 'hospital.regional.cecilio.a.castillero.enterprise@facilitymanagerpro.com',
    password: 'HospitalCastillero#2024'
  },
  {
    email: 'hospital.regional.de.azuero.anita.moreno.enterprise@facilitymanagerpro.com',
    password: 'HospitalMoreno#2024'
  },
  {
    email: 'hospital.san.miguel.arc.ngel.enterprise@facilitymanagerpro.com',
    password: 'HospitalArcangel#2024'
  },
  {
    email: 'hospital.regional.nicol.s.a.solano.enterprise@facilitymanagerpro.com',
    password: 'HospitalSolano#2024'
  }
]

async function createUsers() {
  for (const user of enterpriseUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message)
      } else {
        console.log(`Successfully created user ${user.email}`)
      }
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }
}

createUsers() 