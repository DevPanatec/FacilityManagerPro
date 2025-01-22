import { createClient } from '@supabase/supabase-js'

export async function checkAndCleanRooms() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Faltan las variables de entorno necesarias')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener todas las salas
    const { data: salas, error: selectError } = await supabase
        .from('salas')
        .select('*')
        .order('nombre')
    
    if (selectError) {
        console.error('Error obteniendo salas:', selectError)
        throw selectError
    }
    
    console.log('\nSalas actuales:')
    salas?.forEach(sala => {
        console.log(sala.nombre)
    })
    
    // Eliminar duplicados manteniendo solo el primer registro de cada nombre
    const { error: deleteError } = await supabase
        .rpc('eliminar_salas_duplicadas')
    
    if (deleteError) {
        console.error('Error eliminando duplicados:', deleteError)
        throw deleteError
    }
    
    // Verificar resultado final
    const { data: salasFinales, error: finalError } = await supabase
        .from('salas')
        .select('*')
        .order('nombre')
    
    if (finalError) {
        console.error('Error obteniendo salas finales:', finalError)
        throw finalError
    }
    
    console.log('\nSalas después de eliminar duplicados:')
    salasFinales?.forEach(sala => {
        console.log(sala.nombre)
    })
    
    return { success: true }
} 