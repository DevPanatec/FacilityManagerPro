import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan las variables de entorno necesarias')
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Obtener todas las salas
        const { data: salas, error } = await supabase
            .from('salas')
            .select('*')
            .order('nombre')
        
        if (error) {
            throw error
        }
        
        return NextResponse.json({ salas })
    } catch (error: any) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Error obteniendo las salas', details: error.message },
            { status: 500 }
        )
    }
}

export async function DELETE() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan las variables de entorno necesarias')
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Eliminar todas las salas
        const { error } = await supabase
            .from('salas')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Truco para que funcione el delete sin where
        
        if (error) {
            throw error
        }
        
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Error eliminando las salas', details: error.message },
            { status: 500 }
        )
    }
}

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan las variables de entorno necesarias')
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        
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
        
        // Insertar las salas
        for (const nombre of salas) {
            const { error } = await supabase
                .from('salas')
                .insert([{ nombre }])
            
            if (error) {
                throw error
            }
        }
        
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Error insertando las salas', details: error.message },
            { status: 500 }
        )
    }
} 