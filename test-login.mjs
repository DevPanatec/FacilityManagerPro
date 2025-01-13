import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wldiefpqmfjxernvuywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.EGnF81c5_pZnQvmrygjcLVppWOQS5pIwAkiLxOucpjY'
)

async function testLogin() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@facilitymanagerpro.com',
      password: 'Admin123456!'
    })

    if (error) {
      console.error('Error de login:', error.message)
      return
    }

    console.log('Login exitoso:', data)
  } catch (err) {
    console.error('Error:', err)
  }
}

testLogin() 