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

const checkChatRooms = async () => {
  try {
    console.log('Verificando chat rooms existentes...')

    // Obtener todos los chat rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_members (
          user_id,
          role
        )
      `)

    if (roomsError) {
      console.error('Error al obtener chat rooms:', roomsError)
      return
    }

    console.log('Chat rooms encontrados:', JSON.stringify(rooms, null, 2))

    // Eliminar el chat room de "MEDICINA DE VARONES" si existe
    const medicinaRoom = rooms?.find(room => room.name === 'MEDICINA DE VARONES')
    if (medicinaRoom) {
      console.log('Eliminando chat room de Medicina de Varones...')
      const { error: deleteError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', medicinaRoom.id)

      if (deleteError) {
        console.error('Error al eliminar chat room:', deleteError)
        return
      }
      console.log('Chat room eliminado exitosamente')
    }

  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

checkChatRooms() 