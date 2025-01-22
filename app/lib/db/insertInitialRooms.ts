import { createClient } from '../supabase/client'
import { insertRooms } from './insertRooms'

export async function insertInitialRooms() {
    const supabase = createClient()
    
    // Obtener la primera organización
    const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
    
    if (orgError) {
        console.error('Error obteniendo organización:', orgError)
        throw orgError
    }
    
    if (!organizations) {
        throw new Error('No se encontró ninguna organización')
    }
    
    // Insertar las salas usando el ID de la organización
    return await insertRooms(organizations.id)
}

// Ejecutar la inserción
insertInitialRooms()
    .then(() => console.log('Salas insertadas correctamente'))
    .catch((error) => console.error('Error insertando salas:', error)) 