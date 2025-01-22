import { createClient } from '@supabase/supabase-js'

const salas = [
    'MEDICINA DE VARONES',
    'MEDICINA DE MUJERES',
    'CIRUGÍA',
    'ESPECIALIDADES',
    'PEDIATRÍA',
    'GINECO OBSTETRICIA',
    'PUERPERIO',
    'SALÓN DE OPERACIONES',
    'PARTO',
    'UCI',
    'RADIOLOGÍA',
    'LABORATORIO',
    'URGENCIAS'
]

export async function insertRooms(organizationId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Faltan las variables de entorno necesarias')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Insertar cada sala
    for (const nombre of salas) {
        const { error } = await supabase
            .from('salas')
            .insert([
                { 
                    nombre: nombre
                }
            ])
            .select()
        
        if (error) {
            console.error('Error insertando sala:', nombre, error)
            throw error
        }
    }
    
    return { success: true }
} 