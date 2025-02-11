import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const createChatRoom = async () => {
  try {
    // Primero obtenemos el ID del hospital
    const { data: hospital, error: hospitalError } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', '%San Miguel Arcángel%')
      .single()

    if (hospitalError) {
      console.error('Error al buscar el hospital:', hospitalError)
      return
    }

    if (!hospital) {
      console.error('No se encontró el hospital')
      return
    }

    console.log('Hospital encontrado:', hospital)

    // Obtener el primer usuario admin del hospital para usarlo como created_by
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', hospital.id)
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError) {
      console.error('Error al buscar admin:', adminError)
      return
    }

    if (!admin) {
      console.error('No se encontró un admin para el hospital')
      return
    }

    console.log('Admin encontrado:', admin)

    // Crear la sala de chat
    const { data: chatRoom, error: chatError } = await supabase
      .from('chat_rooms')
      .insert({
        name: 'MEDICINA DE VARONES',
        type: 'group',
        organization_id: hospital.id,
        created_by: admin.id,
        status: 'active',
        description: 'Sala de chat para el área de Medicina de Varones'
      })
      .select()
      .single()

    if (chatError) {
      console.error('Error al crear la sala de chat:', chatError)
      return
    }

    console.log('Sala de chat creada:', chatRoom)

    // Crear membresía para el admin
    const { error: membershipError } = await supabase
      .from('chat_room_members')
      .insert({
        room_id: chatRoom.id,
        user_id: admin.id,
        organization_id: hospital.id,
        role: 'admin',
        status: 'active'
      })

    if (membershipError) {
      console.error('Error al crear membresía:', membershipError)
      return
    }

    console.log('Sala de chat creada exitosamente con membresía para el admin')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

createChatRoom() 