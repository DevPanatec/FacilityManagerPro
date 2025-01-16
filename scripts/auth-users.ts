import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.EGnF81c5_pZnQvmrygjcLVppWOQS5pIwAkiLxOucpjY'
)

const users = [
  // Superadmins
  { email: 'superadmin1@facilitymanagerpro.com', password: 'Fmp09c35628#2024' },
  { email: 'superadmin2@facilitymanagerpro.com', password: 'Fmp09c35628#2024' },
  { email: 'superadmin3@facilitymanagerpro.com', password: 'Fmp09c35628#2024' },
  { email: 'superadmin4@facilitymanagerpro.com', password: 'Fmp09c35628#2024' },
  { email: 'superadmin5@facilitymanagerpro.com', password: 'Fmp09c35628#2024' },

  // Hospital Franco
  { email: 'hospital.dr.joaqu.n.pablo.franco.sayas.enterprise@facilitymanagerpro.com', password: 'HospitalFranco#2024' },
  { email: 'hospital.dr.joaqu.n.pablo.franco.sayas.admin1@facilitymanagerpro.com', password: 'HospitalFranco#2024' },
  { email: 'hospital.dr.joaqu.n.pablo.franco.sayas.admin2@facilitymanagerpro.com', password: 'HospitalFranco#2024' },
  { email: 'hospital.dr.joaqu.n.pablo.franco.sayas.admin3@facilitymanagerpro.com', password: 'HospitalFranco#2024' },

  // Hospital Castillero
  { email: 'hospital.regional.cecilio.a.castillero.enterprise@facilitymanagerpro.com', password: 'HospitalCastillero#2024' },
  { email: 'hospital.regional.cecilio.a.castillero.admin1@facilitymanagerpro.com', password: 'HospitalCastillero#2024' },
  { email: 'hospital.regional.cecilio.a.castillero.admin2@facilitymanagerpro.com', password: 'HospitalCastillero#2024' },
  { email: 'hospital.regional.cecilio.a.castillero.admin3@facilitymanagerpro.com', password: 'HospitalCastillero#2024' },

  // Hospital Moreno
  { email: 'hospital.regional.de.azuero.anita.moreno.enterprise@facilitymanagerpro.com', password: 'HospitalMoreno#2024' },
  { email: 'hospital.regional.de.azuero.anita.moreno.admin1@facilitymanagerpro.com', password: 'HospitalMoreno#2024' },
  { email: 'hospital.regional.de.azuero.anita.moreno.admin2@facilitymanagerpro.com', password: 'HospitalMoreno#2024' },
  { email: 'hospital.regional.de.azuero.anita.moreno.admin3@facilitymanagerpro.com', password: 'HospitalMoreno#2024' },

  // Hospital Solano
  { email: 'hospital.regional.nicol.s.a.solano.enterprise@facilitymanagerpro.com', password: 'HospitalSolano#2024' },
  { email: 'hospital.regional.nicol.s.a.solano.admin1@facilitymanagerpro.com', password: 'HospitalSolano#2024' },
  { email: 'hospital.regional.nicol.s.a.solano.admin2@facilitymanagerpro.com', password: 'HospitalSolano#2024' },
  { email: 'hospital.regional.nicol.s.a.solano.admin3@facilitymanagerpro.com', password: 'HospitalSolano#2024' },

  // Hospital Arcángel
  { email: 'hospital.san.miguel.arc.ngel.enterprise@facilitymanagerpro.com', password: 'HospitalArcangel#2024' },
  { email: 'hospital.san.miguel.arc.ngel.admin1@facilitymanagerpro.com', password: 'HospitalArcangel#2024' },
  { email: 'hospital.san.miguel.arc.ngel.admin2@facilitymanagerpro.com', password: 'HospitalArcangel#2024' },
  { email: 'hospital.san.miguel.arc.ngel.admin3@facilitymanagerpro.com', password: 'HospitalArcangel#2024' },

  // Instituto Hernández
  { email: 'instituto.de.salud.mental.mat.as.hern.ndez.enterprise@facilitymanagerpro.com', password: 'InstitutoHernandez#2024' },
  { email: 'instituto.de.salud.mental.mat.as.hern.ndez.admin1@facilitymanagerpro.com', password: 'InstitutoHernandez#2024' },
  { email: 'instituto.de.salud.mental.mat.as.hern.ndez.admin2@facilitymanagerpro.com', password: 'InstitutoHernandez#2024' },
  { email: 'instituto.de.salud.mental.mat.as.hern.ndez.admin3@facilitymanagerpro.com', password: 'InstitutoHernandez#2024' }
]

async function authenticateUsers() {
  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (error) {
        console.error(`Error authenticating ${user.email}:`, error.message)
      } else {
        console.log(`Successfully authenticated ${user.email}`)
      }

      // Esperar un momento entre cada autenticación para evitar rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error with ${user.email}:`, error)
    }
  }
}

authenticateUsers() 