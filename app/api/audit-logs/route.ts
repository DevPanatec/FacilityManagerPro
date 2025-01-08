import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error)
    return NextResponse.json(
      { error: 'Error al obtener logs de auditoría' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { userId, action, description, metadata } = await request.json()

    if (!userId || !action || !description) {
      return NextResponse.json(
        { error: 'Se requieren todos los campos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action,
          description,
          metadata
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al crear log de auditoría:', error)
    return NextResponse.json(
      { error: 'Error al crear log de auditoría' },
      { status: 500 }
    )
  }
} 