import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, date, area_id } = body

    if (!title || !area_id) {
      return NextResponse.json(
        { error: 'Se requiere título y área' },
        { status: 400 }
      )
    }

    // Crear la tarea
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          area_id,
          due_date: date,
          created_by: session.user.id,
          status: 'pending',
          priority: 'medium'
        }
      ])
      .select()
      .single()

    if (taskError) {
      console.error('Error al crear tarea:', taskError)
      return NextResponse.json(
        { error: 'Error al crear la tarea' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, task },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error en create-task:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener tareas
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error al obtener tareas:', tasksError)
      return NextResponse.json(
        { error: 'Error al obtener las tareas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('Error al obtener tareas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 